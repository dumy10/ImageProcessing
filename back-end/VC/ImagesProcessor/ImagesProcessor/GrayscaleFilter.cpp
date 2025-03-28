#include "pch.h"
#include "GrayscaleFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void GrayscaleFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying grayscale filter");
	const int size = width * height * channels;

#pragma omp parallel for
	for (int i = 0; i < size; i += channels)
	{
		unsigned char r = inputImage[i];
		unsigned char g = inputImage[i + 1];
		unsigned char b = inputImage[i + 2];
		unsigned char gray = static_cast<unsigned char>(r * 0.3f + g * 0.59f + b * 0.11f);
		outputImage[i] = gray;
		if (channels > 1 && i + 1 < size) outputImage[i + 1] = gray;
		if (channels > 2 && i + 2 < size) outputImage[i + 2] = gray;
	}

	Logger::GetInstance().LogMessage("Grayscale filter applied successfully");
}

#pragma warning(default : 6993) // Restore warning about OpenMP not being supported in this configuration