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
     */
    inline void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const override
    {
        Logger::LogMessage("Applying grayscale filter");
        int size = width * height * channels;
        for (int i = 0; i < size; i += channels)
        {
            unsigned char r = inputImage[i];
            unsigned char g = inputImage[i + 1];
            unsigned char b = inputImage[i + 2];
            unsigned char gray = static_cast<unsigned char>(r * 0.3f + g * 0.59f + b * 0.11f);
            outputImage[i] = gray;
            if (channels > 1 && i + 1 < size) outputImage[i + 1] = gray;
            if (channels > 2 && i + 2 < size) outputImage[i + 2] = gray;
        }
        Logger::LogMessage("Grayscale filter applied successfully");
    }
};
