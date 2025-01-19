#include "pch.h"
#include "ImageData.h"

ImageData::ImageData(const unsigned char* imageData, int length, const std::string& extension) : m_extension{ extension }
{
	Logger::GetInstance().LogMessage("Loading image data with extension: " + extension);
	m_imageData = stbi_load_from_memory(reinterpret_cast<const unsigned char*>(imageData), length, &m_width, &m_height, &m_channels, 0);

	if (!m_imageData)
	{
		Logger::GetInstance().LogError("Failed to load image data");
		throw std::runtime_error("Failed to load image data");
	}

	m_imageSize = m_width * m_height * m_channels;

	Logger::GetInstance().LogMessage("Image data loaded successfully to memory.");
}

ImageData::~ImageData()
{
	if (m_imageData)
	{
		Logger::GetInstance().LogMessage("Freeing image data");
		stbi_image_free(m_imageData);
		m_imageData = nullptr;
	}
}

void ImageData::FilterImage(EDefinedFilters filter, unsigned char** outputData, int* outputLength) const
{
	Logger::GetInstance().LogMessage("Filtering image data with filter: " + std::to_string(static_cast<int>(filter)));

	std::unique_ptr<unsigned char[]> outputImage(new unsigned char[m_imageSize]);

	if (!this->ApplyFilter(filter, outputImage.get()))
	{
		*outputLength = 0;
		*outputData = nullptr;
	}

	std::vector<unsigned char> encodedData;

	if (!this->WriteToMemory(outputImage.get(), &encodedData))
	{
		Logger::GetInstance().LogError("Failed to write image data to memory");
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}
	Logger::GetInstance().LogMessage("Image data written to memory successfully");

	*outputLength = static_cast<int>(encodedData.size());
	*outputData = new unsigned char[*outputLength];

	std::memcpy(*outputData, encodedData.data(), *outputLength);

	Logger::GetInstance().LogMessage("Image data filtered successfully");
}

[[nodiscard]] bool ImageData::ApplyFilter(EDefinedFilters filterType, unsigned char* outputImage) const
{
	try
	{
		auto filter = FilterFactory::CreateFilter(filterType);
		filter->Apply(m_imageData, outputImage, m_width, m_height, m_channels);
		return true;
	}
	catch (const std::exception& e)
	{
		Logger::GetInstance().LogError(e.what());
		return false;
	}
}

[[nodiscard]] bool ImageData::WriteToMemory(unsigned char* outputImage, std::vector<unsigned char>* encodedData) const
{
	Logger::GetInstance().LogMessage("Writing image data to memory");

	encodedData->reserve(m_imageSize);

	bool success = false;

	if (m_extension == ".png")
	{
		success = stbi_write_png_to_func(kWriteCallback, encodedData, m_width, m_height, m_channels, outputImage, m_width * m_channels);
	}
	else if (m_extension == ".jpg" || m_extension == ".jpeg")
	{
		success = stbi_write_jpg_to_func(kWriteCallback, encodedData, m_width, m_height, m_channels, outputImage, m_width * m_channels);
	}
	else
	{
		Logger::GetInstance().LogError("Extension not supported: " + m_extension);
	}

	return success;
}