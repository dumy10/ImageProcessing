#include "pch.h"
#include "InvertFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void InvertFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, const ProgressCallback& progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying invert filter");

	ReportProgressIfNeeded(progressCallback, 60);

	const int size = width * height * channels;
	
#pragma omp parallel for
	for (int i = 0; i < size; i++)
	{
		outputImage[i] = inputImage[i] ^ 0xFF; // Invert the pixel value
	}

	ReportProgressIfNeeded(progressCallback, 70);

	Logger::GetInstance().LogMessage("Invert filter applied successfully");
}

#pragma warning(default : 6993) // Restore warning about OpenMP not being supported in this configuration