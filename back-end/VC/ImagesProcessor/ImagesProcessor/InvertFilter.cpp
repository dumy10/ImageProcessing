#include "pch.h"
#include "InvertFilter.h"
#include <omp.h>

void InvertFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, ProgressCallback progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying invert filter");

	if (progressCallback)
		progressCallback(0);

	const int size = width * height * channels;

	std::transform(std::execution::par, inputImage, inputImage + size, outputImage, [](unsigned char pixel) { return pixel ^ 0xFF; });

	if (progressCallback)
		progressCallback(100);

	Logger::GetInstance().LogMessage("Invert filter applied successfully");
}
