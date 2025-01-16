#include "pch.h"
#include "CannyFilter.h"

void CannyFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::LogMessage("Applying Canny filter");

	// Step 1: Convert to grayscale
	std::vector<unsigned char> grayImage(width * height);
	for (int i = 0; i < width * height * channels; i += channels)
	{
		unsigned char r = inputImage[i];
		unsigned char g = inputImage[i + 1];
		unsigned char b = inputImage[i + 2];
		grayImage[i / channels] = static_cast<unsigned char>(r * 0.3f + g * 0.59f + b * 0.11f);
	}

	// Step 2: Apply Gaussian blur
	std::vector<unsigned char> blurredImage = ApplyGaussianBlur(grayImage.data(), width, height);

	// Step 3: Calculate gradients
	std::vector<float> gradientMagnitude(width * height);
	std::vector<float> gradientDirection(width * height);
	CalculateGradients(blurredImage.data(), gradientMagnitude.data(), gradientDirection.data(), width, height);

	// Step 4: Non-maximum suppression
	std::vector<unsigned char> nonMaxSuppressed = NonMaximumSuppression(gradientMagnitude.data(), gradientDirection.data(), width, height);

	// Step 5: Edge tracking by hysteresis
	std::vector<unsigned char> edges = Hysteresis(nonMaxSuppressed.data(), width, height);

	// Copy result to output image
	for (int i = 0; i < width * height; i++)
	{
		std::fill(outputImage + i * channels, outputImage + (i + 1) * channels, edges[i]);
	}

	Logger::LogMessage("Canny filter applied successfully");
}

[[nodiscard]] std::vector<unsigned char> CannyFilter::ApplyGaussianBlur(const unsigned char* inputImage, int width, int height) const
{
	// Gaussian kernel (3x3)
	float kernel[3][3] = {
		{1 / 16.0f, 2 / 16.0f, 1 / 16.0f},
		{2 / 16.0f, 4 / 16.0f, 2 / 16.0f},
		{1 / 16.0f, 2 / 16.0f, 1 / 16.0f}
	};

	std::vector<unsigned char> outputImage(width * height);

	for (int y = 1; y < height - 1; y++)
	{
		for (int x = 1; x < width - 1; x++)
		{
			float sum = 0.0f;
			for (int ky = -1; ky <= 1; ky++)
			{
				for (int kx = -1; kx <= 1; kx++)
				{
					int pixel = inputImage[(y + ky) * width + (x + kx)];
					sum += pixel * kernel[ky + 1][kx + 1];
				}
			}
			outputImage[static_cast<std::vector<unsigned char, std::allocator<unsigned char>>::size_type>(y) * width + x] = static_cast<unsigned char>(sum);
		}
	}

	Logger::LogMessage("Gaussian blur applied successfully");

	return outputImage;
}

void CannyFilter::CalculateGradients(const unsigned char* inputImage, float* gradientMagnitude, float* gradientDirection, int width, int height) const
{
	// Sobel kernels
	int kernelX[3][3] = { {-1, 0, 1}, {-2, 0, 2}, {-1, 0, 1} };
	int kernelY[3][3] = { {-1, -2, -1}, {0, 0, 0}, {1, 2, 1} };

	for (int y = 1; y < height - 1; y++)
	{
		for (int x = 1; x < width - 1; x++)
		{
			float sumX = 0.0f;
			float sumY = 0.0f;
			for (int ky = -1; ky <= 1; ky++)
			{
				for (int kx = -1; kx <= 1; kx++)
				{
					int pixel = inputImage[(y + ky) * width + (x + kx)];
					sumX += pixel * kernelX[ky + 1][kx + 1];
					sumY += pixel * kernelY[ky + 1][kx + 1];
				}
			}
			gradientMagnitude[y * width + x] = std::sqrt(sumX * sumX + sumY * sumY);
			gradientDirection[y * width + x] = std::atan2(sumY, sumX);
		}
	}

	Logger::LogMessage("Gradients calculated successfully");
}

[[nodiscard]] std::vector<unsigned char> CannyFilter::NonMaximumSuppression(const float* gradientMagnitude, const float* gradientDirection, int width, int height) const
{
	std::vector<unsigned char> outputImage(width * height, 0);

	for (int y = 1; y < height - 1; y++)
	{
		for (int x = 1; x < width - 1; x++)
		{
			float angle = gradientDirection[y * width + x] * 180.0f / M_PI;
			angle = angle < 0 ? angle + 180 : angle;

			float mag = gradientMagnitude[y * width + x];
			float mag1, mag2;

			if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle <= 180))
			{
				mag1 = gradientMagnitude[y * width + (x + 1)];
				mag2 = gradientMagnitude[y * width + (x - 1)];
			}
			else if (angle >= 22.5 && angle < 67.5)
			{
				mag1 = gradientMagnitude[(y + 1) * width + (x - 1)];
				mag2 = gradientMagnitude[(y - 1) * width + (x + 1)];
			}
			else if (angle >= 67.5 && angle < 112.5)
			{
				mag1 = gradientMagnitude[(y + 1) * width + x];
				mag2 = gradientMagnitude[(y - 1) * width + x];
			}
			else
			{
				mag1 = gradientMagnitude[(y - 1) * width + (x - 1)];
				mag2 = gradientMagnitude[(y + 1) * width + (x + 1)];
			}

			if (mag >= mag1 && mag >= mag2)
			{
				outputImage[static_cast<std::vector<unsigned char, std::allocator<unsigned char>>::size_type>(y) * width + x] = static_cast<unsigned char>(mag);
			}
		}
	}

	Logger::LogMessage("Non-maximum suppression applied successfully");

	return outputImage;
}

[[nodiscard]] std::vector<unsigned char> CannyFilter::Hysteresis(const unsigned char* inputImage, int width, int height) const
{
	std::vector<unsigned char> outputImage(width * height, 0);

	const unsigned char highThreshold = 100;
	const unsigned char lowThreshold = 50;

	for (int y = 1; y < height - 1; y++)
	{
		for (int x = 1; x < width - 1; x++)
		{
			if (inputImage[y * width + x] >= highThreshold)
			{
				outputImage[static_cast<std::vector<unsigned char, std::allocator<unsigned char>>::size_type>(y) * width + x] = 255;
			}
			else if (inputImage[y * width + x] >= lowThreshold)
			{
				bool connectedToStrongEdge = false;
				for (int ky = -1; ky <= 1; ky++)
				{
					for (int kx = -1; kx <= 1; kx++)
					{
						if (inputImage[(y + ky) * width + (x + kx)] >= highThreshold)
						{
							connectedToStrongEdge = true;
							break;
						}
					}
					if (connectedToStrongEdge) break;
				}
				if (connectedToStrongEdge)
				{
					outputImage[static_cast<std::vector<unsigned char, std::allocator<unsigned char>>::size_type>(y) * width + x] = 255;
				}
			}
		}
	}

	Logger::LogMessage("Edge tracking by hysteresis applied successfully");

	return outputImage;
}
