#include "pch.h"
#include "InvertFilter.h"

void InvertFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance()->LogMessage("Applying invert filter");
	int size = width * height * channels;
	for (int i = 0; i < size; i += channels)
	{
		unsigned char r = inputImage[i];
		unsigned char g = inputImage[i + 1];
		unsigned char b = inputImage[i + 2];
		outputImage[i] = 255 - r;
		if (channels > 1 && i + 1 < size) outputImage[i + 1] = 255 - g;
		if (channels > 2 && i + 2 < size) outputImage[i + 2] = 255 - b;
	}
	Logger::GetInstance()->LogMessage("Invert filter applied successfully");
}
