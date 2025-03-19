#include "pch.h"
#include "SobelFilter.h"
#include <omp.h>

void SobelFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying Sobel filter");

	int size = width * height * channels;

	// Sobel filter kernels
	int kernelX[3][3] = { { -1, 0, 1 },{ -2, 0, 2 },{ -1, 0, 1 } };
	int kernelY[3][3] = { { -1, -2, -1 },{ 0, 0, 0 },{ 1, 2, 1 } };

	std::vector<unsigned char> tempImage(size);

	// Parallel horizontal pass
#pragma warning(push) 
#pragma warning(disable: 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
#pragma omp parallel for 
	for (int y = 0; y < height; y++)
	{
		for (int x = 0; x < width; x++)
		{
			std::vector<float> sumX(channels, 0.0f);
			std::vector<float> sumY(channels, 0.0f);

			for (int i = -1; i <= 1; i++)
			{
				for (int j = -1; j <= 1; j++)
				{
					int sampleX = x + j;
					int sampleY = y + i;
					if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height)
					{
						int sampleIndex = (sampleY * width + sampleX) * channels;
						for (int c = 0; c < channels; c++)
						{
							sumX[c] += inputImage[sampleIndex + c] * kernelX[i + 1][j + 1];
							sumY[c] += inputImage[sampleIndex + c] * kernelY[i + 1][j + 1];
						}
					}
				}
			}

			int index = (y * width + x) * channels;
			for (int c = 0; c < channels; c++)
			{
				if (index + c < size)
				{
					tempImage[index + c] = static_cast<unsigned char>(std::sqrt(sumX[c] * sumX[c] + sumY[c] * sumY[c]));
				}
			}
		}
	}

	// Second pass
#pragma omp parallel for 
	for (int y = 0; y < height; y++)
	{
		for (int x = 0; x < width; x++)
		{
			std::vector<float> sumX(channels, 0.0f);
			std::vector<float> sumY(channels, 0.0f);

			for (int i = -1; i <= 1; i++)
			{
				for (int j = -1; j <= 1; j++)
				{
					int sampleX = x + j;
					int sampleY = y + i;
					if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height)
					{
						int sampleIndex = (sampleY * width + sampleX) * channels;
						for (int c = 0; c < channels; c++)
						{
							sumX[c] += tempImage[sampleIndex + c] * kernelX[i + 1][j + 1];
							sumY[c] += tempImage[sampleIndex + c] * kernelY[i + 1][j + 1];
						}
					}
				}
			}

			int index = (y * width + x) * channels;
			for (int c = 0; c < channels; c++)
			{
				if (index + c < size)
				{
					outputImage[index + c] = static_cast<unsigned char>(std::sqrt(sumX[c] * sumX[c] + sumY[c] * sumY[c]));
				}
			}
		}
	}
#pragma warning(pop) // Restore warning settings

	Logger::GetInstance().LogMessage("Sobel filter applied successfully");
}
