#pragma once
#include <omp.h>
#include "IFilter.h"

/**
 * @brief A filter that applies the Sobel edge detection algorithm to an image.
 *
 * This class implements the IFilter interface to provide edge detection
 * using the Sobel operator with parallel processing.
 */
class SobelFilter : public IFilter
{
public:
	/**
	 * @brief Applies the Sobel filter to an image.
	 *
	 * This method applies the Sobel edge detection algorithm to the input image
	 * and stores the result in the output image.
	 *
	 * @param inputImage Pointer to the input image data.
	 * @param outputImage Pointer to the output image data.
	 * @param width Width of the image.
	 * @param height Height of the image.
	 * @param channels Number of color channels in the image.
	 */
	void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const override;
};
