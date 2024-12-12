#include "pch.h"
#include "ImagesProcessor.h"

void ApplyFilter(const char* imageData, int length, const char* filter, unsigned char** outputData, const char* extension, int* outputLength)
{
	Logger::LogMessage("ApplyFilter Start");
	Logger::LogMessage("Applying filter: " + std::move(std::string{ filter }) + " to image data of length: " + std::move(std::to_string(length)));
	Logger::LogMessage("Output data will be stored in: " + std::move(std::string{ extension }) + " format");

	// Check if the extension received is allowed
	if (kAllowedExtensions.find(extension) == kAllowedExtensions.end())
	{
		Logger::LogWarning("Extension not allowed: " + std::move(std::string{ extension }));
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	// Check if the filter received is allowed
	if (kDefinedFilters.find(filter) == kDefinedFilters.end())
	{
		Logger::LogWarning("Filter not allowed: " + std::move(std::string{ filter }));
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	// Create an ImageData object with the received data
	std::unique_ptr<ImageData> image = std::make_unique<ImageData>(reinterpret_cast<const unsigned char*>(imageData), length, extension);

	// Filter the image data
	image->FilterImage(kDefinedFilters.at(filter), outputData, outputLength);

	Logger::LogMessage("ApplyFilter End");
}

void FreeMemory(unsigned char* data)
{
	Logger::LogMessage("FreeMemory Start");

	if (!data)
	{
		Logger::LogWarning("FreeMemory called with null data.");
		return;
	}

	Logger::LogMessage("Freeing memory for received data.");
	delete[] data;
	data = nullptr;

	Logger::LogMessage("FreeMemory End");
}
