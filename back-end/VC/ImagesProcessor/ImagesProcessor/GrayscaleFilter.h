#pragma once
#include "IFilter.h"

/**
 * @brief A filter that converts an image to grayscale.
 *
 * This class implements the IFilter interface to provide a grayscale effect
 * by converting each pixel to its grayscale equivalent.
 */
class GrayscaleFilter : public IFilter
{
public:
	/**
	 * @brief Applies the grayscale filter to an image.
	 *
	 * This method converts the input image to grayscale and stores the result
	 * in the output image.
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
