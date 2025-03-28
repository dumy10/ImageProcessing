#pragma once
#include "pch.h"
#include "FilterFactory.h"
#include "IFilter.h"
#include <omp.h>
#include <stb_image.h>
#include <stb_image_write.h>

/**
 * @brief Callback function for writing image data.
 */
static stbi_write_func* kWriteCallback = [](void* context, void* data, int size) {
	auto* buffer = static_cast<std::vector<unsigned char>*>(context);

	// Minimize reallocation
	size_t currentSize = buffer->size();
	buffer->resize(currentSize + size);

	std::memcpy(buffer->data() + currentSize, data, size);
	};

static const size_t kImageQuality = 100; ///< Quality of the jpg image.

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
	 * @brief Writes the image data to memory.
	 *
	 * @param outputImage Pointer to the output image data.
	 * @param encodedData Pointer to the vector to store the encoded data.
	 * @return True if the image data was written successfully, false otherwise.
	 */
	[[nodiscard]] bool WriteToMemory(unsigned char* outputImage, std::vector<unsigned char>* encodedData) const;

	/**
	 * @brief Applies a specified filter to the image data.
	 *
	 * @param filter The filter to apply.
	 * @param outputImage Pointer to the output image data.
	 * @return True if the filter was applied successfully, false otherwise.
	 */
	[[nodiscard]] bool ApplyFilter(EDefinedFilters filterType, unsigned char* outputImage) const;
private:
	std::string m_extension; ///< File extension of the image.
	unsigned char* m_imageData; ///< Pointer to the image data.
	int m_width; ///< Width of the image.
	int m_height; ///< Height of the image.
	int m_channels; ///< Number of channels in the image.
	int m_imageSize; ///< Size of the image data.
};