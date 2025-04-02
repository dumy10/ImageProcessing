#include "pch.h"
#include "MosaicFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void MosaicFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, ProgressCallback progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying mosaic filter to image.");

	if (progressCallback)
		progressCallback(60);

	static constexpr int tileSize = 10;
	const int numTilesX = width / tileSize;
	const int numTilesY = height / tileSize;

#pragma omp parallel for schedule(dynamic)
	for (int tileY = 0; tileY < numTilesY; tileY++)
	{
		for (int tileX = 0; tileX < numTilesX; tileX++)
		{
			int avgR = 0, avgG = 0, avgB = 0;
			int validPixelCount = 0;

			// Compute the average color for the tile
			for (int y = 0; y < tileSize; y++)
			{
				int pixelY = tileY * tileSize + y;
				if (pixelY >= height) break;

				for (int x = 0; x < tileSize; x++)
				{
					int pixelX = tileX * tileSize + x;
					if (pixelX >= width) break;

					int pixelIndex = (pixelY * width + pixelX) * channels;
					avgR += inputImage[pixelIndex];
					avgG += inputImage[pixelIndex + 1];
					avgB += inputImage[pixelIndex + 2];
					validPixelCount++;
				}
			}

			if (validPixelCount > 0) {
				avgR /= validPixelCount;
				avgG /= validPixelCount;
				avgB /= validPixelCount;
			}

			// Apply the average color to the tile
			for (int y = 0; y < tileSize; y++)
			{
				int pixelY = tileY * tileSize + y;
				if (pixelY >= height) break;

				for (int x = 0; x < tileSize; x++)
				{
					int pixelX = tileX * tileSize + x;
					if (pixelX >= width) break;

					int pixelIndex = (pixelY * width + pixelX) * channels;
					outputImage[pixelIndex] = avgR;
					outputImage[pixelIndex + 1] = avgG;
					outputImage[pixelIndex + 2] = avgB;
				}
			}
		}
	}

	if (progressCallback)
		progressCallback(70);

	Logger::GetInstance().LogMessage("Mosaic filter applied to image.");
}

#pragma warning(default : 6993) // Restore warning about OpenMP not being supported in this configuration