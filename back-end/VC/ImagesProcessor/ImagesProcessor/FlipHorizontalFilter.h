#pragma once
#include "IFilter.h"

/**
 * @brief A filter that flips an image horizontally.
 *
 * This class implements the IFilter interface to provide a vertical flip effect
 * by flipping the input image horizontally.
 */
class FlipHorizontalFilter : public IFilter
{
public:
	/**
	 * @brief Applies the horizontal flip filter to an image.
	 *
	 * This method flips the input image horizontally and stores the result
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