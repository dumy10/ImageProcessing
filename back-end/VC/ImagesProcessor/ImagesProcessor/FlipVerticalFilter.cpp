#include "pch.h"
#include "FlipVerticalFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void FlipVerticalFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, ProgressCallback progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying FlipVerticalFilter");

	if (progressCallback)
		progressCallback(0);

	const int rowSize = width * channels;

#pragma omp parallel for
	for (int y = 0; y < height; y++)
	{
		int srcRowOffset = y * rowSize;
		int dstRowOffset = (height - y - 1) * rowSize;

		// Copy the row from inputImage to the flipped position in outputImage
		std::copy(inputImage + srcRowOffset, inputImage + srcRowOffset + rowSize, outputImage + dstRowOffset);
	}
	
	if (progressCallback)
		progressCallback(100);

	Logger::GetInstance().LogMessage("Applied FlipVerticalFilter");
}

#pragma warning(default : 6993) // Restore warning about OpenMP not being supported in this configuration