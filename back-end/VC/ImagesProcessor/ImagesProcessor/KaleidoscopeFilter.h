#pragma once
#include "IFilter.h"

/**
 * @brief Kaleidoscope filter.
 */

class KaleidoscopeFilter : public IFilter
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
	 */
	void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const override;
};