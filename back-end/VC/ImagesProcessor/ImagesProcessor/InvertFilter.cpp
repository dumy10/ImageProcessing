#include "pch.h"
#include "InvertFilter.h"
#include <omp.h>

void InvertFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, ProgressCallback progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying invert filter");

	if (progressCallback)
		progressCallback(60);

	const int size = width * height * channels;
	
#pragma omp parallel for
	for (int i = 0; i < size; i++)
	{
		outputImage[i] = inputImage[i] ^ 0xFF;
	}

	if (progressCallback)
		progressCallback(70);

	Logger::GetInstance().LogMessage("Invert filter applied successfully");
}
