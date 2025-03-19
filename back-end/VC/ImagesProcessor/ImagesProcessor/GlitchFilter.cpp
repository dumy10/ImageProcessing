#include "pch.h"
#include "GlitchFilter.h"
#include <omp.h>

void GlitchFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying glitch filter to the image");

	// Copy the input image to the output image
	std::copy(inputImage, inputImage + width * height * channels, outputImage);

	// Seed for random number generators
	std::random_device rd;
	unsigned int seed = rd();

	// Randomly shift pixel columns
	int numColumnsToShift = width / 20; // Number of columns to shift 
#pragma warning(push) 
#pragma warning(disable: 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
#pragma omp parallel
	{
		// Each thread gets its own random number generator
		std::mt19937 gen(seed + omp_get_thread_num());
		std::uniform_int_distribution<> columnDist(0, width - 1);
		std::uniform_int_distribution<> shiftDist(-10, 10); // Shift by up to 10 pixels

#pragma omp for
		for (int i = 0; i < numColumnsToShift; i++)
		{
			int column = columnDist(gen);
			int shift = shiftDist(gen);

			for (int y = 0; y < height; y++)
			{
				int srcX = std::clamp(column + shift, 0, width - 1);
				int dstIndex = (y * width + column) * channels;
				int srcIndex = (y * width + srcX) * channels;

				std::copy(outputImage + srcIndex, outputImage + srcIndex + channels, outputImage + dstIndex);
			}
		}
	}

	// Randomly shift color channels
	int numPixelsToAlter = (width * height) / 100; // Number of pixels to alter

#pragma omp parallel
	{
		// Each thread gets its own random number generator
		std::mt19937 gen(seed + omp_get_thread_num() + 1000);
		std::uniform_int_distribution<> pixelDist(0, width * height - 1);
		std::uniform_int_distribution<> channelDist(0, channels - 1);

#pragma omp for
		for (int i = 0; i < numPixelsToAlter; i++)
		{
			int pixelIndex = pixelDist(gen) * channels;
			int channel1 = channelDist(gen);
			int channel2 = channelDist(gen);

			std::swap(outputImage[pixelIndex + channel1], outputImage[pixelIndex + channel2]);
		}
	}

#pragma warning(pop)

	Logger::GetInstance().LogMessage("Glitch filter applied");
}
