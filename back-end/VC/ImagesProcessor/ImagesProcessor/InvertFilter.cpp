#include "pch.h"
#include "InvertFilter.h"
#include <omp.h>

void InvertFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying invert filter");
	int size = width * height * channels;

#pragma warning(push) 
#pragma warning(disable: 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
#pragma omp parallel for
	for (int i = 0; i < size; i++)
	{
		outputImage[i] = inputImage[i] ^ 0xFF;
	}

#pragma warning(pop)

	Logger::GetInstance().LogMessage("Invert filter applied successfully");
}
