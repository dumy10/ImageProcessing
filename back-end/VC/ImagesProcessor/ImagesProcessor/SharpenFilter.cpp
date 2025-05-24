#include "pch.h"
#include "BlurFilter.h"
#include "SharpenFilter.h"
#include <omp.h>

#pragma warning(disable : 6993)

void SharpenFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, const ProgressCallback& progressCallback) const
{
    Logger::GetInstance().LogMessage("Applying sharpen filter (Unsharp Mask)");

    const int size = width * height * channels;

    ReportProgressIfNeeded(progressCallback, 55);
    
    // Step 1: Create a blurred version of the input image
    std::vector<unsigned char> blurredImage(size);
    BlurFilter blurFilter;
    blurFilter.Apply(inputImage, blurredImage.data(), width, height, channels, nullptr);

    ReportProgressIfNeeded(progressCallback, 60);

    // Step 2: Apply unsharp mask formula: output = original + amount * (original - blurred)
    const float amount = 1.5f; // Sharpening strength

#pragma omp parallel for
    for (int i = 0; i < size; i++) 
    {
        // Calculate the difference between original and blurred
        int diff = static_cast<int>(inputImage[i]) - static_cast<int>(blurredImage[i]);

        // Apply unsharp mask formula with clamping to valid range [0-255]
        int sharpened = static_cast<int>(inputImage[i]) + static_cast<int>(amount * diff);
        outputImage[i] = static_cast<unsigned char>(std::min<int>(255, std::max<int>(0, sharpened)));
    }

    ReportProgressIfNeeded(progressCallback, 70);
    Logger::GetInstance().LogMessage("Sharpen filter applied successfully");
}

#pragma warning(default : 6993)