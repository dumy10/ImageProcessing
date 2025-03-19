#include "pch.h"
#include "FlipVerticalFilter.h"
#include <omp.h>

void FlipVerticalFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying FlipVerticalFilter");
	const int rowSize = width * channels;

#pragma warning(push) 
#pragma warning(disable: 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
#pragma omp parallel for
	for (int y = 0; y < height; y++)
	{
		int srcRowOffset = y * rowSize;
		int dstRowOffset = (height - y - 1) * rowSize;

		// Copy the row from inputImage to the flipped position in outputImage
		for (int x = 0; x < rowSize; x++)
		{
			outputImage[dstRowOffset + x] = inputImage[srcRowOffset + x];
		}
	}

#pragma warning(pop)

	Logger::GetInstance().LogMessage("Applied FlipVerticalFilter");
}
