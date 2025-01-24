#include "pch.h"
#include "SobelFilter.h"

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
#pragma warning(disable : 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
#pragma omp parallel for
	for (int y = 0; y < height; y++)
	{
		for (int x = 0; x < width; x++)
		{
			float sumX[4] = { 0 };
			float sumY[4] = { 0 };
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
				// Ensure buffer overflow does not happen
				tempImage[static_cast<std::vector<unsigned char, std::allocator<unsigned char>>::size_type>(index) + c] = static_cast<unsigned char>(std::sqrt(sumX[c] * sumX[c] + sumY[c] * sumY[c]));
			}
		}
	}
	// Parallel vertical pass
#pragma omp parallel for
	for (int y = 0; y < height; y++)
	{
		for (int x = 0; x < width; x++)
		{
			float sumX[4] = { 0 };
			float sumY[4] = { 0 };
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
							// Ensure buffer overflow does not happen
							sumX[c] += tempImage[static_cast<std::vector<unsigned char, std::allocator<unsigned char>>::size_type>(sampleIndex) + c] * kernelX[i + 1][j + 1];
							sumY[c] += tempImage[static_cast<std::vector<unsigned char, std::allocator<unsigned char>>::size_type>(sampleIndex) + c] * kernelY[i + 1][j + 1];
						}
					}
				}
			}
			int index = (y * width + x) * channels;
			for (int c = 0; c < channels; c++)
			{
				if (index + c < size) // Ensure buffer overflow does not happen
				{
					outputImage[index + c] = static_cast<unsigned char>(std::sqrt(sumX[c] * sumX[c] + sumY[c] * sumY[c]));
				}
			}
		}
	}
#pragma warning(pop) // Restore warning settings

	Logger::GetInstance().LogMessage("Sobel filter applied successfully");
}
