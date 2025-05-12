#include "pch.h"
#include "OilPaintFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void OilPaintFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, const ProgressCallback& progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying oil paint filter");

	ReportProgressIfNeeded(progressCallback, 60);

	static constexpr int filterRadius = 4;
	static constexpr int intensityLevels = 256;

	const int imageSize = width * height;

	// Precompute intensity values
	std::vector<int> intensityMap(imageSize);
#pragma omp parallel for
	for (int idx = 0; idx < imageSize; idx++)
	{
		int i = idx * channels;
		int intensity = (inputImage[i] + inputImage[i + 1] + inputImage[i + 2]) / 3;
		intensityMap[idx] = intensity;
	}

#pragma omp parallel
	{
		int localIntensityCount[intensityLevels] = { 0 };
		int localSumR[intensityLevels] = { 0 };
		int localSumG[intensityLevels] = { 0 };
		int localSumB[intensityLevels] = { 0 };

#pragma omp for schedule(dynamic)
		for (int y = 0; y < height; y++)
		{
			for (int x = 0; x < width; x++)
			{
				// Reset local arrays
				memset(localIntensityCount, 0, sizeof(localIntensityCount));
				memset(localSumR, 0, sizeof(localSumR));
				memset(localSumG, 0, sizeof(localSumG));
				memset(localSumB, 0, sizeof(localSumB));

				// Neighborhood calculation
				for (int offsetY = -filterRadius; offsetY <= filterRadius; offsetY++)
				{
					int sampleY = y + offsetY;
					if (sampleY < 0)
						sampleY = 0;
					else if (sampleY >= height)
						sampleY = height - 1;

					for (int offsetX = -filterRadius; offsetX <= filterRadius; offsetX++)
					{
						int sampleX = x + offsetX;
						if (sampleX < 0)
							sampleX = 0;
						else if (sampleX >= width)
							sampleX = width - 1;

						int sampleIdx = sampleY * width + sampleX;
						int intensity = intensityMap[sampleIdx];

						int idx = sampleIdx * channels;
						localIntensityCount[intensity]++;
						localSumR[intensity] += inputImage[idx];
						localSumG[intensity] += inputImage[idx + 1];
						localSumB[intensity] += inputImage[idx + 2];
					}
				}

				// Find the dominant intensity
				int maxCount = 0;
				int dominantIntensity = 0;
				for (int i = 0; i < intensityLevels; i++)
				{
					if (localIntensityCount[i] > maxCount)
					{
						maxCount = localIntensityCount[i];
						dominantIntensity = i;
					}
				}

				// Assign the most frequent color
				int index = (y * width + x) * channels;
				if (maxCount > 0)
				{
					outputImage[index] = localSumR[dominantIntensity] / maxCount;
					outputImage[index + 1] = localSumG[dominantIntensity] / maxCount;
					outputImage[index + 2] = localSumB[dominantIntensity] / maxCount;
				}
				else
				{
					// Fallback to the original pixel value
					outputImage[index] = inputImage[index];
					outputImage[index + 1] = inputImage[index + 1];
					outputImage[index + 2] = inputImage[index + 2];
				}
			}
		}
	}

	ReportProgressIfNeeded(progressCallback, 70);

	Logger::GetInstance().LogMessage("Oil paint filter applied");
}

#pragma warning(default : 6993) // Restore warning settings
