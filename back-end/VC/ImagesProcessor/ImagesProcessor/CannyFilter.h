#pragma once
#include "IFilter.h"
/**
* This is a placeholder for the Canny filter.
*/
class CannyFilter : public IFilter
{
public:
	inline void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const override
	{
		Logger::LogMessage("Applying Canny filter");
		int size = width * height * channels;
		for (int i = 0; i < size; i += channels)
		{
			unsigned char r = inputImage[i];
			unsigned char g = inputImage[i + 1];
			unsigned char b = inputImage[i + 2];
			outputImage[i] = r;
			if (channels > 1 && i + 1 < size) outputImage[i + 1] = g; // Ensure buffer overflow does not happen
			if (channels > 2 && i + 2 < size) outputImage[i + 2] = b;
		}
		Logger::LogMessage("Canny filter applied successfully");
	}
};