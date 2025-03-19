#include "pch.h"
#include "MosaicFilter.h"
#include <omp.h>

void MosaicFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying mosaic filter to image.");

	const int tileSize = 10;
	const int numTilesX = width / tileSize;
	const int numTilesY = height / tileSize;

	#pragma warning(push) 
	#pragma warning(disable: 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
	#pragma omp parallel for
	for (int tileY = 0; tileY < numTilesY; tileY++)
	{
		for (int tileX = 0; tileX < numTilesX; tileX++)
		{
			int avgR = 0;
			int avgG = 0;
			int avgB = 0;
			for (int y = 0; y < tileSize; y++)
			{
				for (int x = 0; x < tileSize; x++)
				{
					const int pixelX = tileX * tileSize + x;
					const int pixelY = tileY * tileSize + y;
					const int pixelIndex = (pixelY * width + pixelX) * channels;
					avgR += inputImage[pixelIndex + 0];
					avgG += inputImage[pixelIndex + 1];
					avgB += inputImage[pixelIndex + 2];
				}
			}
			avgR /= tileSize * tileSize;
			avgG /= tileSize * tileSize;
			avgB /= tileSize * tileSize;
			for (int y = 0; y < tileSize; y++)
			{
				for (int x = 0; x < tileSize; x++)
				{
					const int pixelX = tileX * tileSize + x;
					const int pixelY = tileY * tileSize + y;
					const int pixelIndex = (pixelY * width + pixelX) * channels;
					outputImage[pixelIndex + 0] = avgR;
					outputImage[pixelIndex + 1] = avgG;
					outputImage[pixelIndex + 2] = avgB;
				}
			}
		}
	}

	#pragma warning(pop)

	Logger::GetInstance().LogMessage("Mosaic filter applied to image.");
}
