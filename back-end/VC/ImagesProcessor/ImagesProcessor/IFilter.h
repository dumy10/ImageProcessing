#pragma once
#include "pch.h"

/**
 * @brief Interface for image filters.
 *
 * This interface defines the contract for applying filters to images.
 */
class IFilter
{
public:
	/**
	 * @brief Virtual destructor for the IFilter interface.
	 *
	 * Ensures derived classes can clean up resources properly.
	 */
	virtual ~IFilter() = default;

	/**
	 * @brief Applies the filter to an image.
	 *
	 * @param inputImage Pointer to the input image data.
	 * @param outputImage Pointer to the output image data.
	 * @param width Width of the image.
	 * @param height Height of the image.
	 * @param channels Number of color channels in the image.
	 */
	virtual void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const = 0;
};
