#include "pch.h"
#include "SobelFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void SobelFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, const ProgressCallback& progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying Sobel filter");

	ReportProgressIfNeeded(progressCallback, 60);

	// Sobel filter kernels
	static constexpr int kernelX[3][3] = { { -1, 0, 1 },{ -2, 0, 2 },{ -1, 0, 1 } };
	static constexpr int kernelY[3][3] = { { -1, -2, -1 },{ 0, 0, 0 },{ 1, 2, 1 } };

	const int size = width * height * channels;

#pragma omp parallel for
	for (int y = 0; y < height; y++)
	{
		// Pre-allocate arrays
		std::vector<float> sumX(channels, 0.0f);
		std::vector<float> sumY(channels, 0.0f);
		for (int x = 0; x < width; x++)
		{
			// Reset arrays for each pixel
			std::fill(sumX.begin(), sumX.end(), 0.0f);
			std::fill(sumY.begin(), sumY.end(), 0.0f);

			// Convolution with boundary checking
			for (int i = -1; i <= 1; i++)
			{
				int sampleY = y + i;
				if (sampleY < 0) sampleY = 0;
				else if (sampleY >= height) sampleY = height - 1;

				for (int j = -1; j <= 1; j++)
				{
					int sampleX = x + j;
					if (sampleX < 0) sampleX = 0;
					else if (sampleX >= width) sampleX = width - 1;

					int sampleIndex = (sampleY * width + sampleX) * channels;

					for (int c = 0; c < channels; c++)
					{
						float pixel = inputImage[sampleIndex + c];
						sumX[c] += pixel * kernelX[i + 1][j + 1];
						sumY[c] += pixel * kernelY[i + 1][j + 1];
					}
				}
			}

			// Compute gradient magnitude and write to output
			int index = (y * width + x) * channels;
			for (int c = 0; c < channels; c++)
			{
				float magnitude = std::sqrt(sumX[c] * sumX[c] + sumY[c] * sumY[c]);
				if (magnitude > 255.0f) magnitude = 255.0f;
				outputImage[index + c] = static_cast<unsigned char>(magnitude);
			}
		}
	}

	ReportProgressIfNeeded(progressCallback, 70);

	Logger::GetInstance().LogMessage("Sobel filter applied successfully");
}

#pragma warning(default : 6993) // Restore warning about OpenMP not being supported in this configuration