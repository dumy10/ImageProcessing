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
    inline void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const override
    {
        Logger::LogMessage("Applying invert filter");
        int size = width * height * channels;
        for (int i = 0; i < size; i += channels)
        {
            unsigned char r = inputImage[i];
            unsigned char g = inputImage[i + 1];
            unsigned char b = inputImage[i + 2];
            outputImage[i] = 255 - r;
            if (channels > 1 && i + 1 < size) outputImage[i + 1] = 255 - g;
            if (channels > 2 && i + 2 < size) outputImage[i + 2] = 255 - b;
        }
        Logger::LogMessage("Invert filter applied successfully");
    }
};
