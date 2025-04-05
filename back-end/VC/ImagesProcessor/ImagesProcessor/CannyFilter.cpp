#include "pch.h"
#include "CannyFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration
// It is supported but the Code Analysis tool does not recognize it

void CannyFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, ProgressCallback progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying Canny filter");

	if (progressCallback)
		progressCallback(60);

	// 1. Convert to grayscale
	std::vector<unsigned char> grayImage(width * height);

#pragma omp parallel for
	for (int i = 0; i < width * height; i++)
	{
		if (channels > 1)
		{
			const unsigned char* pixel = inputImage + (i * channels);
			grayImage[i] = static_cast<unsigned char>(0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]);
		}
		else
		{
			std::copy_n(inputImage + i, 1, grayImage.begin() + i);
		}
	}

	// 2. Apply Gaussian Blur for noise reduction
	std::vector<unsigned char> blurredImage(width * height);
	ApplyGaussianBlur(grayImage.data(), blurredImage.data(), width, height);

	// 3. Compute Gradient Magnitude and Direction
	std::vector<float> gradientMagnitude(width * height);
	std::vector<float> gradientDirection(width * height);
	CalculateGradients(blurredImage.data(), gradientMagnitude.data(), gradientDirection.data(), width, height);

	// 4. Non-Maximum Suppression
	std::vector<unsigned char> suppressedImage(width * height, 0);
	NonMaximumSuppression(gradientMagnitude.data(), gradientDirection.data(), suppressedImage.data(), width, height);

	// 5. Double Threshold and Edge Tracking by Hysteresis
	std::vector<unsigned char> finalEdges(width * height, 0);
	DoubleThresholdAndHysteresis(suppressedImage.data(), finalEdges.data(), width, height);

	// 6. Copy to output image, expanding to original number of channels
#pragma omp parallel for
	for (int i = 0; i < width * height; i++)
	{
		for (int c = 0; c < channels; c++)
		{
			outputImage[i * channels + c] = finalEdges[i];
		}
	}

	if (progressCallback)
		progressCallback(70);

	Logger::GetInstance().LogMessage("Canny filter applied successfully");
}

void CannyFilter::ApplyGaussianBlur(const unsigned char* inputImage, unsigned char* outputImage, int width, int height) const
{
	// 5x5 Gaussian kernel
	static constexpr float kernel[5][5] = {
		{1 / 256.0f, 4 / 256.0f,  6 / 256.0f,  4 / 256.0f, 1 / 256.0f},
		{4 / 256.0f, 16 / 256.0f, 24 / 256.0f, 16 / 256.0f, 4 / 256.0f},
		{6 / 256.0f, 24 / 256.0f, 36 / 256.0f, 24 / 256.0f, 6 / 256.0f},
		{4 / 256.0f, 16 / 256.0f, 24 / 256.0f, 16 / 256.0f, 4 / 256.0f},
		{1 / 256.0f, 4 / 256.0f,  6 / 256.0f,  4 / 256.0f, 1 / 256.0f}
	};

	// Perform convolution with Gaussian kernel
	std::fill_n(outputImage, width * height, 0);

#pragma omp parallel for
	for (int y = 2; y < height - 2; y++)
	{
		for (int x = 2; x < width - 2; x++)
		{
			float sum = 0.0f;
			for (int ky = -2; ky <= 2; ky++)
			{
				for (int kx = -2; kx <= 2; kx++)
				{
					int pixelIndex = (y + ky) * width + (x + kx);
					sum += inputImage[pixelIndex] * kernel[ky + 2][kx + 2];
				}
			}
			outputImage[y * width + x] = static_cast<unsigned char>(sum);
		}
	}

	// Handle border cases by copying edge pixels
	std::copy_n(inputImage, width * 2, outputImage);
	std::copy_n(inputImage + (height - 2) * width, width * 2, outputImage + (height - 2) * width);

	for (int y = 0; y < height; y++)
	{
		outputImage[y * width] = inputImage[y * width];
		outputImage[y * width + width - 1] = inputImage[y * width + width - 1];
	}
}

void CannyFilter::CalculateGradients(const unsigned char* inputImage, float* gradientMagnitude, float* gradientDirection, int width, int height) const
{
	// Sobel operators for x and y
	static constexpr int sobelX[3][3] = { {-1, 0, 1}, {-2, 0, 2}, {-1, 0, 1} };
	static constexpr int sobelY[3][3] = { {-1, -2, -1}, {0, 0, 0}, {1, 2, 1} };

#pragma omp parallel for
	for (int y = 1; y < height - 1; y++)
	{
		for (int x = 1; x < width - 1; x++)
		{
			float gx = 0.0f, gy = 0.0f;
			for (int ky = -1; ky <= 1; ky++)
			{
				for (int kx = -1; kx <= 1; kx++)
				{
					int pixelIndex = (y + ky) * width + (x + kx);
					gx += inputImage[pixelIndex] * sobelX[ky + 1][kx + 1];
					gy += inputImage[pixelIndex] * sobelY[ky + 1][kx + 1];
				}
			}

			int index = y * width + x;
			gradientMagnitude[index] = std::sqrt(gx * gx + gy * gy);
			gradientDirection[index] = std::atan2(gy, gx) * 180.0f / M_PI;
		}
	}
}

void CannyFilter::NonMaximumSuppression(const float* gradientMagnitude, const float* gradientDirection, unsigned char* outputImage, int width, int height) const
{
	// Initialize output to zero
	std::fill_n(outputImage, width * height, 0);

#pragma omp parallel for
	for (int y = 1; y < height - 1; y++)
	{
		for (int x = 1; x < width - 1; x++)
		{
			int index = y * width + x;
			float angle = gradientDirection[index];
			float magnitude = gradientMagnitude[index];

			// Normalize angle to 0-180 degrees
			angle = angle < 0 ? angle + 180 : angle;

			// Interpolate neighboring pixels based on gradient direction
			float neighbor1 = 0, neighbor2 = 0;
			if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle <= 180))
			{
				neighbor1 = gradientMagnitude[index - 1];
				neighbor2 = gradientMagnitude[index + 1];
			}
			else if (angle >= 22.5 && angle < 67.5)
			{
				neighbor1 = gradientMagnitude[index - width - 1];
				neighbor2 = gradientMagnitude[index + width + 1];
			}
			else if (angle >= 67.5 && angle < 112.5)
			{
				neighbor1 = gradientMagnitude[index - width];
				neighbor2 = gradientMagnitude[index + width];
			}
			else if (angle >= 112.5 && angle < 157.5)
			{
				neighbor1 = gradientMagnitude[index - width + 1];
				neighbor2 = gradientMagnitude[index + width - 1];
			}

			// Suppress non-maximum pixels
			outputImage[index] = (magnitude >= neighbor1 && magnitude >= neighbor2) ? static_cast<unsigned char>(magnitude) : 0;
		}
	}
}

void CannyFilter::DoubleThresholdAndHysteresis(const unsigned char* inputImage, unsigned char* outputImage, int width, int height) const
{
	static constexpr float lowThresholdRatio = 0.1f;
	static constexpr float highThresholdRatio = 0.3f;

	// Find max gradient magnitude for thresholding
	unsigned char maxMagnitude = 0;
#pragma omp parallel
	{
		unsigned char localMax = 0;
#pragma omp for nowait
		for (int i = 0; i < width * height; i++)
		{
			if (inputImage[i] > localMax)
			{
				localMax = inputImage[i];
			}
		}
#pragma omp critical
		{
			if (localMax > maxMagnitude)
			{
				maxMagnitude = localMax;
			}
		}
	}

	unsigned char lowThreshold = static_cast<unsigned char>(maxMagnitude * lowThresholdRatio);
	unsigned char highThreshold = static_cast<unsigned char>(maxMagnitude * highThresholdRatio);

	// Copy input to output initially
	std::copy_n(inputImage, width * height, outputImage);

	// Hysteresis tracking
#pragma omp parallel for
	for (int y = 1; y < height - 1; y++)
	{
		for (int x = 1; x < width - 1; x++)
		{
			int index = y * width + x;
			unsigned char pixelValue = inputImage[index];

			if (pixelValue >= highThreshold)
			{
				outputImage[index] = 255;  // Strong edge
			}
			else if (pixelValue >= lowThreshold)
			{
				// Check 8-connected neighborhood for strong edges
				bool hasStrongNeighbor = false;
				// Replace std::any_of with a direct loop
				for (int ky = -1; ky <= 1 && !hasStrongNeighbor; ky++)
				{
					for (int kx = -1; kx <= 1 && !hasStrongNeighbor; kx++)
					{
						int neighborIdx = (y + ky) * width + (x + kx);
						if (neighborIdx >= 0 && neighborIdx < width * height && inputImage[neighborIdx] >= highThreshold)
						{
							hasStrongNeighbor = true;
						}
					}
				}

				outputImage[index] = hasStrongNeighbor ? 255 : 0;
			}
			else
			{
				outputImage[index] = 0;  // Weak edge or non-edge
			}
		}
	}
}

#pragma warning(default : 6993) // Restore warning about OpenMP not being supported in this configuration
