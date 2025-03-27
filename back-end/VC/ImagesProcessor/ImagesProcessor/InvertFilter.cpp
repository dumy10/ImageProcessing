#include "pch.h"
#include "InvertFilter.h"
#include <omp.h>

void InvertFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying invert filter");
	const int size = width * height * channels;

	std::transform(std::execution::par, inputImage, inputImage + size, outputImage, [](unsigned char pixel) { return pixel ^ 0xFF; });

	Logger::GetInstance().LogMessage("Invert filter applied successfully");
}
