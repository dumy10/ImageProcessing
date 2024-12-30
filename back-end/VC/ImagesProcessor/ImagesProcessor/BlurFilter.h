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
    inline void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const override
    {
        Logger::LogMessage("Applying blur filter");

        int kernelSize = 7; // The kernel defines how much blur the image will have.
        int halfKernel = kernelSize / 2;

        int size = width * height * channels;

        unsigned char* tempImage = new unsigned char[size];

        // Parallel horizontal pass
#pragma warning(push)
#pragma warning(disable : 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
#pragma omp parallel for
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                float sum[4] = { 0 };
                int count = 0;

                for (int k = -halfKernel; k <= halfKernel; ++k)
                {
                    int sampleX = x + k;

                    if (sampleX >= 0 && sampleX < width)
                    {
                        int sampleIndex = (y * width + sampleX) * channels;

                        for (int c = 0; c < channels; c++)
                        {
                            sum[c] += inputImage[sampleIndex + c];
                        }
                        count++;
                    }
                }

                int index = (y * width + x) * channels;
                for (int c = 0; c < channels; c++)
                {
                    if (index + c < size) // Ensure buffer overflow does not happen
                    {
                        tempImage[index + c] = static_cast<unsigned char>(sum[c] / count);
                    }
                }
            }
        }
        // Parallel vertical pass
#pragma omp parallel for
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                float sum[4] = { 0 };
                int count = 0;

                for (int k = -halfKernel; k <= halfKernel; k++)
                {
                    int sampleY = y + k;

                    if (sampleY >= 0 && sampleY < height)
                    {
                        int sampleIndex = (sampleY * width + x) * channels;

                        for (int c = 0; c < channels; c++)
                        {
                            sum[c] += tempImage[sampleIndex + c];
                        }
                        count++;
                    }
                }

                int index = (y * width + x) * channels;
                for (int c = 0; c < channels; c++)
                {
                    if (index + c < size) // Ensure buffer overflow does not happen
                    {
                        outputImage[index + c] = static_cast<unsigned char>(sum[c] / count);
                    }
                }
            }
        }
#pragma warning(pop) // Restore warning settings
        delete[] tempImage;
        tempImage = nullptr;

        Logger::LogMessage("Blur filter applied successfully");
    }
};
