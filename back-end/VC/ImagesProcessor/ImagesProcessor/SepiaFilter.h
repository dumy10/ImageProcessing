#pragma once
#include "IFilter.h"

/**
* @brief A filter that applies a sepia effect to an image.
* 
* This class implements the IFilter interface to provide a sepia effect
* using a simple sepia transformation matrix.
*/
class SepiaFilter : public IFilter
{
public:
	/**
	* @brief Applies the sepia filter to an image.
	* 
	* @param inputImage Pointer to the input image data.
	* @param outputImage Pointer to the output image data.
	* @param width Width of the image.
	* @param height Height of the image.
	* @param channels Number of color channels in the image.
	 * @param progressCallback Optional callback function for progress updates.
	 */
	void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, const ProgressCallback& progressCallback = nullptr) const override;
};

