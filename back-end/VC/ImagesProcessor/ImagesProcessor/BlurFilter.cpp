#include "pch.h"
#include "BlurFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void BlurFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, const ProgressCallback& progressCallback) const
{
	ReportProgressIfNeeded(progressCallback, 60);

	Logger::GetInstance().LogMessage("Applying blur filter");
    static constexpr int kernelSize = 7; // Defines the blur intensity.
    static constexpr int halfKernel = kernelSize / 2;
    const int size = width * height * channels;

    // Compute integral images for each channel
    std::vector<uint64_t> integralImages(size, 0);

    // Parallel computation of integral images
#pragma omp parallel for
    for (int c = 0; c < channels; c++)
    {
        for (int y = 0; y < height; y++)
        {
            uint64_t sum = 0;
            for (int x = 0; x < width; x++)
            {
                int idx = (y * width + x) * channels + c;
                sum += inputImage[idx];
                if (y == 0)
                {
                    integralImages[idx] = sum;
                }
                else
                {
                    integralImages[idx] = sum + integralImages[idx - width * channels];
                }
            }
        }
    }

    // Apply blur using the integral image
#pragma omp parallel for
    for (int idx = 0; idx < width * height; idx++)
    {
        int x = idx % width;
        int y = idx / width;

        int x0 = x - halfKernel;
        int y0 = y - halfKernel;
        int x1 = x + halfKernel;
        int y1 = y + halfKernel;

        // Clamp coordinates to image boundaries
        x0 = std::max<int>(x0, 0);
        y0 = std::max<int>(y0, 0);
        x1 = std::min<int>(x1, width - 1);
        y1 = std::min<int>(y1, height - 1);

        int area = (x1 - x0 + 1) * (y1 - y0 + 1);

        for (int c = 0; c < channels; c++)
        {
            uint64_t sum = 0;

            int idxA = (y0 > 0 && x0 > 0) ? ((y0 - 1) * width + (x0 - 1)) * channels + c : -1;
            int idxB = (y0 > 0) ? ((y0 - 1) * width + x1) * channels + c : -1;
            int idxC = (x0 > 0) ? (y1 * width + (x0 - 1)) * channels + c : -1;
            int idxD = (y1 * width + x1) * channels + c;

            sum = integralImages[idxD];
            if (idxB != -1)
                sum -= integralImages[idxB];
            if (idxC != -1)
                sum -= integralImages[idxC];
            if (idxA != -1)
                sum += integralImages[idxA];

            int outIdx = idx * channels + c;
            outputImage[outIdx] = static_cast<unsigned char>(sum / area);
        }
    }
	ReportProgressIfNeeded(progressCallback, 100);

	Logger::GetInstance().LogMessage("Blur filter applied successfully");
}

#pragma warning(default : 6993) // Restore warning settings