#include "pch.h"
#include "ImageData.h"

ImageData::ImageData(const unsigned char* imageData, int length, const std::string& extension) : m_extension{ extension }
{
	Logger::LogMessage("Loading image data with extension: " + extension);
	m_imageData = stbi_load_from_memory(reinterpret_cast<const unsigned char*>(imageData), length, &m_width, &m_height, &m_channels, 0);

	if (!m_imageData)
	{
		Logger::LogError("Failed to load image data");
		throw std::runtime_error("Failed to load image data");
	}

	m_imageSize = m_width * m_height * m_channels;

	Logger::LogMessage("Image data loaded successfully to memory.");
}

ImageData::~ImageData()
{
	if (m_imageData)
	{
		Logger::LogMessage("Freeing image data");
		stbi_image_free(m_imageData);
	}
}

void ImageData::FilterImage(EDefinedFilters filter, unsigned char** outputData, int* outputLength) const
{
	Logger::LogMessage("Filtering image data with filter: " + std::move(std::to_string(static_cast<int>(filter))));

	unsigned char* outputImage = new unsigned char[m_imageSize];

	switch (filter)
	{
	case EDefinedFilters::GRAYSCALE:
	{
		this->ApplyGrayscaleFilter(outputImage);
		break;
	}
	case EDefinedFilters::INVERT:
	{
		this->ApplyInvertFilter(outputImage);
		break;
	}
	case EDefinedFilters::BLUR:
	{
		this->ApplyBlurFilter(outputImage);
		break;
	}
	default:
	{
		Logger::LogError("Unknown filter received: " + std::move(std::to_string(static_cast<int>(filter))));
		Logger::LogError("Filtering image data failed");
		Logger::LogError("Deleting allocated memory");
		delete[] outputImage;
		outputImage = nullptr;
		*outputLength = 0;
		*outputData = nullptr;
		return;
		break;
	}
	}

	std::vector<unsigned char> encodedData;

	this->WriteToMemory(outputImage, &encodedData);

	*outputLength = static_cast<int>(encodedData.size());
	*outputData = new unsigned char[*outputLength];

	std::memcpy(*outputData, encodedData.data(), *outputLength);

	delete[] outputImage;

	Logger::LogMessage("Image data filtered successfully");
}

void ImageData::ApplyGrayscaleFilter(unsigned char* outputImage) const
{
	Logger::LogMessage("Applying grayscale filter");
	for (int i = 0; i < m_imageSize; i += m_channels)
	{
		unsigned char r = m_imageData[i];
		unsigned char g = m_imageData[i + 1];
		unsigned char b = m_imageData[i + 2];
		unsigned char gray = static_cast<unsigned char>(r * 0.3f + g * 0.59f + b * 0.11f);
		outputImage[i] = gray;
		if (m_channels > 1 && i + 1 < m_imageSize) outputImage[i + 1] = gray; // Ensure buffer overflow does not happen
		if (m_channels > 2 && i + 2 < m_imageSize) outputImage[i + 2] = gray;
	}
	Logger::LogMessage("Grayscale filter applied successfully");
}

void ImageData::ApplyInvertFilter(unsigned char* outputImage) const
{
	Logger::LogMessage("Applying invert filter");
	for (int i = 0; i < m_imageSize; i += m_channels)
	{
		unsigned char r = m_imageData[i];
		unsigned char g = m_imageData[i + 1];
		unsigned char b = m_imageData[i + 2];
		outputImage[i] = 255 - r;
		if (m_channels > 1 && i + 1 < m_imageSize) outputImage[i + 1] = 255 - g; // Ensure buffer overflow does not happen
		if (m_channels > 2 && i + 2 < m_imageSize) outputImage[i + 2] = 255 - b;
	}
	Logger::LogMessage("Invert filter applied successfully");
}

// This function is a placeholder for the blur filter
// It just copies the image data to the output image
void ImageData::ApplyBlurFilter(unsigned char* outputImage) const
{
	Logger::LogMessage("Applying blur filter");
	for (int i = 0; i < m_imageSize; i += m_channels)
	{
		unsigned char r = m_imageData[i];
		unsigned char g = m_imageData[i + 1];
		unsigned char b = m_imageData[i + 2];
		outputImage[i] = r;
		if (m_channels > 1 && i + 1 < m_imageSize) outputImage[i + 1] = g; // Ensure buffer overflow does not happen
		if (m_channels > 2 && i + 2 < m_imageSize) outputImage[i + 2] = b;
	}
	Logger::LogMessage("Blur filter applied successfully");
}

void ImageData::WriteToMemory(unsigned char* outputImage, std::vector<unsigned char>* encodedData) const
{
	Logger::LogMessage("Writing image data to memory");
	if (m_extension == ".png")
	{
		if (!stbi_write_png_to_func(kWriteCallback, encodedData, m_width, m_height, m_channels, outputImage, m_width * m_channels))
		{
			Logger::LogError("Failed to encode image data as " + std::move(m_extension));
			delete[] outputImage;
			outputImage = nullptr;
		}
	}
	else if (m_extension == ".jpg" || m_extension == ".jpeg")
	{
		if (!stbi_write_jpg_to_func(kWriteCallback, encodedData, m_width, m_height, m_channels, outputImage, m_width * m_channels))
		{
			Logger::LogError("Failed to encode image data as " + std::move(m_extension));
			delete[] outputImage;
			outputImage = nullptr;
		}
	}
	else
	{
		Logger::LogError("Extension not supported: " + std::move(m_extension));
		delete[] outputImage;
		outputImage = nullptr;
	}
	Logger::LogMessage("Image data written to memory successfully");
}