#include "pch.h"
#include "FlipVerticalFilter.h"

void FlipVerticalFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying FlipVerticalFilter");
	const int rowSize = width * channels;
	for (int y = 0; y < height; y++)
	{
		const int rowOffset = y * rowSize;
		for (int x = 0; x < width; x++)
		{
			const int offset = rowOffset + (x * channels);
			const int flippedOffset = ((height - y - 1) * rowSize) + (x * channels);
			for (int c = 0; c < channels; c++)
			{
				outputImage[flippedOffset + c] = inputImage[offset + c];
			}
		}
	}
	Logger::GetInstance().LogMessage("Applied FlipVerticalFilter");
}
