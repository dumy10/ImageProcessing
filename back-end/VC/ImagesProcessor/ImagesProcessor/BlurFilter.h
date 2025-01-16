#pragma once
#include <omp.h>
#include "IFilter.h"

/**
 * @brief A filter that applies a blur effect to an image.
 * 
 * This class implements the IFilter interface to provide a blur effect
 * using a simple box blur algorithm with parallel processing.
 */
class BlurFilter : public IFilter
{
public:
    /**
     * @brief Applies the blur filter to an image.
     * 
     * This method applies a horizontal and vertical blur pass to the input image
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
