#pragma once
#include "IFilter.h"

/**
 * @brief Oil paint filter.
 */
class OilPaintFilter : public IFilter
{
public:
	/**
	 * @brief Applies the filter to an image.
	 *
	 * @param inputImage Pointer to the input image data.
	 * @param outputImage Pointer to the output image data.
	 * @param width Width of the image.
	 * @param height Height of the image.
	 * @param channels Number of color channels in the image.
	 * @param progressCallback Optional callback function for progress updates.
	 */
	void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, ProgressCallback progressCallback = nullptr) const override;
};
