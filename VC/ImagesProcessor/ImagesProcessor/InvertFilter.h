#pragma once
#include "IFilter.h"

/**
 * @brief A filter that inverts the colors of an image.
 *
 * This class implements the IFilter interface to provide a color inversion effect
 * by inverting the color values of each pixel.
 */
class InvertFilter : public IFilter
{
public:
	/**
	 * @brief Applies the invert filter to an image.
	 *
	 * This method inverts the colors of the input image and stores the result
	 * in the output image.
	 *
	 * @param inputImage Pointer to the input image data.
	 * @param outputImage Pointer to the output image data.
	 * @param width Width of the image.
	 * @param height Height of the image.
	 * @param channels Number of color channels in the image.
	 */
	void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const override;
};
