#include "pch.h"
#include "FlipHorizontalFilter.h"
#include <omp.h>

void FlipHorizontalFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying FlipHorizontalFilter");
	const int rowSize = width * channels;

#pragma warning(push) 
#pragma warning(disable: 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
#pragma omp parallel for
	for (int y = 0; y < height; y++)
	{
		const int rowOffset = y * rowSize;
		unsigned char* outputRow = outputImage + rowOffset;
		const unsigned char* inputRow = inputImage + rowOffset;

		for (int x = 0; x < width; x++)
		{
			const int offset = x * channels;
			const int flippedOffset = (width - x - 1) * channels;

			// Copy all channels
			for (int c = 0; c < channels; c++)
			{
				outputRow[flippedOffset + c] = inputRow[offset + c];
			}
		}
	}

#pragma warning(pop)

	Logger::GetInstance().LogMessage("Applied FlipHorizontalFilter");
}
