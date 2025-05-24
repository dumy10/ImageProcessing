#include "pch.h"
#include "GlitchFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void GlitchFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, const ProgressCallback& progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying glitch filter to the image");

	ReportProgressIfNeeded(progressCallback, 60);

	// Copy the input image to the output image
#pragma omp parallel for
	for (int i = 0; i < height; i++)
	{
		memcpy(outputImage + i * width * channels, inputImage + i * width * channels, width * channels * sizeof(unsigned char));
	}

	// Seed for random number generators
	std::random_device rd;
	unsigned int seed = rd();

	// Randomly shift pixel columns
	const int numColumnsToShift = width / 20; // Number of columns to shift 
	constexpr int shiftAmount = 10; // Maximum shift amount

#pragma omp parallel
	{
		// Each thread gets its own random number generator
		std::mt19937 gen(seed + omp_get_thread_num());
		std::uniform_int_distribution<> columnDist(0, width - 1);
		std::uniform_int_distribution<> shiftDist(-shiftAmount, shiftAmount); // Shift by up to shiftAmount pixels

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
	const int numPixelsToAlter = (width * height) / 100; // Number of pixels to alter

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

	ReportProgressIfNeeded(progressCallback, 70);

	Logger::GetInstance().LogMessage("Glitch filter applied");
}

#pragma warning(default : 6993) // Restore warning settings