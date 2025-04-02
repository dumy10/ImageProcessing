#pragma once
#include "pch.h"

constexpr float M_PI = 3.14159265358979323846f; /// < Value of Pi

/**
 * @brief Progress callback function type for reporting progress.
 * @param progress Progress value between 0 and 100.
 */
typedef void (*ProgressCallback)(int progress);

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
	 * @param progressCallback Optional callback function for progress updates.
	 */
	virtual void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, ProgressCallback progressCallback = nullptr) const = 0;
};
