#include "pch.h"
#include "GrayscaleFilter.h"
#include <omp.h>

void GrayscaleFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying grayscale filter");
	int size = width * height * channels;

#pragma warning(push) 
#pragma warning(disable: 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
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

#pragma warning(pop)

	Logger::GetInstance().LogMessage("Grayscale filter applied successfully");
}
