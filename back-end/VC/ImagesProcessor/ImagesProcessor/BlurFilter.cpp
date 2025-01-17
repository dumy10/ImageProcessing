#include "pch.h"
#include "BlurFilter.h"

void BlurFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance()->LogMessage("Applying blur filter");
	int kernelSize = 7; // The kernel defines how much blur the image will have.
	int halfKernel = kernelSize / 2;

	int size = width * height * channels;

	std::vector<unsigned char> tempImage(size);

	// Parallel horizontal pass
#pragma warning(push)
#pragma warning(disable : 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
#pragma omp parallel for
	for (int y = 0; y < height; y++)
	{
		for (int x = 0; x < width; x++)
		{
			float sum[4] = { 0 };
			int count = 0;

			for (int k = -halfKernel; k <= halfKernel; ++k)
			{
				int sampleX = x + k;

				if (sampleX >= 0 && sampleX < width)
				{
					int sampleIndex = (y * width + sampleX) * channels;

					for (int c = 0; c < channels; c++)
					{
						sum[c] += inputImage[sampleIndex + c];
					}
					count++;
				}
			}

			int index = (y * width + x) * channels;
			for (int c = 0; c < channels; c++)
			{
				if (index + c < size) // Ensure buffer overflow does not happen
				{
					tempImage[static_cast<std::vector<unsigned char, std::allocator<unsigned char>>::size_type>(index) + c] = static_cast<unsigned char>(sum[c] / count);
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
			float sum[4] = { 0 };
			int count = 0;

			for (int k = -halfKernel; k <= halfKernel; k++)
			{
				int sampleY = y + k;

				if (sampleY >= 0 && sampleY < height)
				{
					int sampleIndex = (sampleY * width + x) * channels;

					for (int c = 0; c < channels; c++)
					{
						sum[c] += tempImage[static_cast<std::vector<unsigned char, std::allocator<unsigned char>>::size_type>(sampleIndex) + c];
					}
					count++;
				}
			}

			int index = (y * width + x) * channels;
			for (int c = 0; c < channels; c++)
			{
				if (index + c < size) // Ensure buffer overflow does not happen
				{
					outputImage[index + c] = static_cast<unsigned char>(sum[c] / count);
				}
			}
		}
	}
#pragma warning(pop) // Restore warning settings

	Logger::GetInstance()->LogMessage("Blur filter applied successfully");
}
