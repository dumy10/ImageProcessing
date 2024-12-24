#pragma once
#include "pch.h"
#include <stb_image.h>
#include <stb_image_write.h>
#include <omp.h>

/**
 * @brief Allowed image file extensions.
 * 
 * Supported extensions:
 * - .png
 * - .jpg
 * - .jpeg
 */
static const std::unordered_map<std::string, EAllowedExtensions> kAllowedExtensions =
{
    {".png", EAllowedExtensions::PNG},
    {".jpg", EAllowedExtensions::JPG},
    {".jpeg", EAllowedExtensions::JPEG},
};

/**
 * @brief Defined image filters.
 * 
 * Supported filters:
 * - grayscale
 * - invert
 * - blur
 * - sobel
 * - canny
 */
static const std::unordered_map<std::string, EDefinedFilters> kDefinedFilters =
{
    {"grayscale", EDefinedFilters::GRAYSCALE},
    {"invert", EDefinedFilters::INVERT},
    {"blur", EDefinedFilters::BLUR},
    {"sobel", EDefinedFilters::SOBEL},
    {"canny", EDefinedFilters::CANNY}
};

/**
 * @brief Callback function for writing image data.
 */
static stbi_write_func* kWriteCallback = [](void* context, void* data, int size) {
    std::vector<unsigned char>* buffer = reinterpret_cast<std::vector<unsigned char>*>(context);
    unsigned char* bytes = reinterpret_cast<unsigned char*>(data);
    buffer->insert(buffer->end(), bytes, bytes + size);
};

/**
 * @brief Class for handling image data and applying filters.
 */
class ImageData
{
public:
    /**
     * @brief Constructs an ImageData object.
     * 
     * @param imageData Pointer to the image data.
     * @param length Length of the image data.
     * @param extension File extension of the image.
     */
    ImageData(const unsigned char* imageData, int length, const std::string& extension);

    /**
     * @brief Destructs the ImageData object.
     */
    ~ImageData();

    /**
     * @brief Applies a specified filter to the image data.
     * 
     * @param filter The filter to apply.
     * @param outputData Pointer to the output data.
     * @param outputLength Pointer to the length of the output data.
     */
    void FilterImage(EDefinedFilters filter, unsigned char** outputData, int* outputLength) const;

private:
    /**
     * @brief Applies a grayscale filter to the image data.
     * 
     * @param outputImage Pointer to the output image data.
     */
    void ApplyGrayscaleFilter(unsigned char* outputImage) const;

    /**
     * @brief Applies an invert filter to the image data.
     * 
     * @param outputImage Pointer to the output image data.
     */
    void ApplyInvertFilter(unsigned char* outputImage) const;

    /**
     * @brief Applies a blur filter to the image data.
     * 
     * @param outputImage Pointer to the output image data.
     */
    void ApplyBlurFilter(unsigned char* outputImage) const;

    /**
     * @brief Applies a Sobel filter to the image data.
     * 
     * @param outputImage Pointer to the output image data.
     */
    void ApplySobelFilter(unsigned char* outputImage) const;

    /**
     * @brief Applies a Canny filter to the image data.
     * 
     * @param outputImage Pointer to the output image data.
     */
    void ApplyCannyFilter(unsigned char* outputImage) const;

    /**
     * @brief Writes the image data to memory.
     * 
     * @param outputImage Pointer to the output image data.
     * @param encodedData Pointer to the vector to store the encoded data.
     */
    void WriteToMemory(unsigned char* outputImage, std::vector<unsigned char>* encodedData) const;

private:
    std::string m_extension; ///< File extension of the image.
    unsigned char* m_imageData; ///< Pointer to the image data.
    int m_width; ///< Width of the image.
    int m_height; ///< Height of the image.
    int m_channels; ///< Number of channels in the image.
    int m_imageSize; ///< Size of the image data.
};