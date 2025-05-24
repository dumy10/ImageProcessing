#include "pch.h"
#include "FlipHorizontalFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void FlipHorizontalFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, const ProgressCallback& progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying FlipHorizontalFilter");

	ReportProgressIfNeeded(progressCallback, 60);

	const int rowSize = width * channels;

#pragma omp parallel for
	for (int y = 0; y < height; y++)
	{
		const int rowOffset = y * rowSize;
		unsigned char* outputRow = outputImage + rowOffset;
		const unsigned char* inputRow = inputImage + rowOffset;

		for (int x = 0; x < width; x++)
		{
			int flippedX = width - x - 1;
			std::copy_n(inputRow + x * channels, channels, outputRow + flippedX * channels);
		}
	}

	ReportProgressIfNeeded(progressCallback, 70);

	Logger::GetInstance().LogMessage("Applied FlipHorizontalFilter");
}

#pragma warning(default : 6993) // Restore warning about OpenMP not being supported in this configuration