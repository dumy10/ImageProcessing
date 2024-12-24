#include "pch.h"
#include "ImagesProcessor.h"

void ApplyFilter(const char* imageData, int length, const char* filter, unsigned char** outputData, const char* extension, int* outputLength)
{
	Logger::LogMessage("ApplyFilter Start");

	// Check if the parameters received are valid
	if (!imageData || length <= 0 || !filter || !extension)
	{
		Logger::LogError("Invalid parameters received.");
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	// Check if the image data received is too large
	if (length > kMaxImageLength)
	{
		Logger::LogWarning("Image data too large: " + std::to_string(length));
		Logger::LogWarning("Filtering will take longer than expected...");
	}

	std::string lowerExtension{ ToLowerCase(extension) };

	// Check if the extension received is allowed
	if (kAllowedExtensions.find(lowerExtension) == kAllowedExtensions.end())
	{
		Logger::LogError("Extension not allowed: " + std::string{ lowerExtension });
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	std::string lowerFilter{ ToLowerCase(filter) };

	// Check if the filter received is allowed
	if (kDefinedFilters.find(lowerFilter) == kDefinedFilters.end())
	{
		Logger::LogError("Filter not allowed: " + std::string{ filter });
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	Logger::LogMessage("Applying filter: " + std::string{ lowerFilter } + " to image data of length: " + std::to_string(length));
	Logger::LogMessage("Output data will be stored in: " + std::string{ lowerExtension } + " format");

	try
	{
		// Create an ImageData object with the received data
		std::unique_ptr<ImageData> image = std::make_unique<ImageData>(reinterpret_cast<const unsigned char*>(imageData), length, lowerExtension);

		// Filter the image data
		image->FilterImage(kDefinedFilters.at(lowerFilter), outputData, outputLength);
	}
	catch (const std::exception& e)
	{
		Logger::LogError("Exception caught: " + std::string{ e.what() });
		*outputLength = 0;
		*outputData = nullptr;
	}


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

std::string ToLowerCase(const std::string& input)
{
	std::string result = input;
	std::transform(result.begin(), result.end(), result.begin(), ::tolower);
	return result;
}