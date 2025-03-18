#include "pch.h"
#include "OilPaintFilter.h"
#include "omp.h"

void OilPaintFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying oil paint filter");

	const int filterRadius = 4;  // Can be adjusted for stronger or weaker effect
	const int intensityLevels = 256; // Levels for color binning

	#pragma warning(push) 
	#pragma warning(disable: 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
	#pragma omp parallel for
	for (int y = 0; y < height; y++)
	{
		for (int x = 0; x < width; x++)
		{
			std::vector<int> intensityCount(intensityLevels, 0);
			std::vector<int> sumR(intensityLevels, 0);
			std::vector<int> sumG(intensityLevels, 0);
			std::vector<int> sumB(intensityLevels, 0);

			for (int offsetY = -filterRadius; offsetY <= filterRadius; offsetY++)
			{
				for (int offsetX = -filterRadius; offsetX <= filterRadius; offsetX++)
				{
					int sampleX = std::clamp(x + offsetX, 0, width - 1);
					int sampleY = std::clamp(y + offsetY, 0, height - 1);
					int sampleIndex = (sampleY * width + sampleX) * channels;

					int intensity = (inputImage[sampleIndex] +
						inputImage[sampleIndex + 1] +
						inputImage[sampleIndex + 2]) / 3;

					intensity = std::clamp(intensity, 0, intensityLevels - 1);

					intensityCount[intensity]++;
					sumR[intensity] += inputImage[sampleIndex];
					sumG[intensity] += inputImage[sampleIndex + 1];
					sumB[intensity] += inputImage[sampleIndex + 2];
				}
			}

			// Find the most dominant intensity
			int dominantIntensity = 0;
			for (int i = 1; i < intensityLevels; i++)
			{
				if (intensityCount[i] > intensityCount[dominantIntensity])
					dominantIntensity = i;
			}

			// Assign the most frequent color in the neighborhood
			int index = (y * width + x) * channels;
			outputImage[index] = sumR[dominantIntensity] / intensityCount[dominantIntensity];
			outputImage[index + 1] = sumG[dominantIntensity] / intensityCount[dominantIntensity];
			outputImage[index + 2] = sumB[dominantIntensity] / intensityCount[dominantIntensity];
		}
	}

	#pragma warning(pop) // Restore warning settings

	Logger::GetInstance().LogMessage("Oil paint filter applied");
}
