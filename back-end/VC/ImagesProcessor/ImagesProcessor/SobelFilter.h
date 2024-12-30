#pragma once
#include <omp.h>
#include "IFilter.h"

/**
 * @brief A filter that applies the Sobel edge detection algorithm to an image.
 *
 * This class implements the IFilter interface to provide edge detection
 * using the Sobel operator with parallel processing.
 */
class SobelFilter : public IFilter
{
public:
	/**
	 * @brief Applies the Sobel filter to an image.
	 *
	 * This method applies the Sobel edge detection algorithm to the input image
	 * and stores the result in the output image.
	 *
	 * @param inputImage Pointer to the input image data.
	 * @param outputImage Pointer to the output image data.
	 * @param width Width of the image.
	 * @param height Height of the image.
	 * @param channels Number of color channels in the image.
	 */
	inline void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const override
	{
		Logger::LogMessage("Applying Sobel filter");

		int size = width * height * channels;

		// Sobel filter kernels
		int kernelX[3][3] = { { -1, 0, 1 },{ -2, 0, 2 },{ -1, 0, 1 } };
		int kernelY[3][3] = { { -1, -2, -1 },{ 0, 0, 0 },{ 1, 2, 1 } };

		unsigned char* tempImage = new unsigned char[size];

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
					if (index + c < size) // Ensure buffer overflow does not happen
					{
						tempImage[index + c] = static_cast<unsigned char>(std::sqrt(sumX[c] * sumX[c] + sumY[c] * sumY[c]));
					}
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
								sumX[c] += tempImage[sampleIndex + c] * kernelX[i + 1][j + 1];
								sumY[c] += tempImage[sampleIndex + c] * kernelY[i + 1][j + 1];
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
		delete[] tempImage;
		tempImage = nullptr;
		Logger::LogMessage("Sobel filter applied successfully");
	}
};
