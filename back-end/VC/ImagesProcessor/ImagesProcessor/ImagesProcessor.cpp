#include "pch.h"
#include "ImagesProcessor.h"

void ApplyFilter(const char* imageData, int length, const char* filter, unsigned char** outputData, const char* extension, int* outputLength)
{
	Logger::LogMessage("ApplyFilter Start");
	Logger::LogMessage("Applying filter: " + std::move(std::string{ filter }) + " to image data of length: " + std::move(std::to_string(length)));
	Logger::LogMessage("Output data will be stored in: " + std::move(std::string{ extension }) + " format");

	// Check if the extension received is allowed
	if (!CheckExtension(extension))
	{
		Logger::LogWarning("Extension not allowed: " + std::move(std::string{ extension }));
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	// Check if the filter received is allowed
	if (!CheckFilter(filter))
	{
		Logger::LogWarning("Filter not allowed: " + std::move(std::string{ filter }));
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	// Create an ImageData object with the received data
	std::unique_ptr<ImageData> image = std::make_unique<ImageData>(reinterpret_cast<const unsigned char*>(imageData), length, extension);

	// Filter the image data
	image->FilterImage(FilterFromString(std::move(std::string{ filter })), outputData, outputLength);

	Logger::LogMessage("ApplyFilter End");
}

void FreeMemory(unsigned char* data)
{
	Logger::LogMessage("FreeMemory Start");
	if (data)
	{
		Logger::LogMessage("Freeing memory for received data.");
		delete[] data;
	}
	else
	{
		Logger::LogWarning("FreeMemory called with null data.");
	}
	Logger::LogMessage("FreeMemory End");
}

bool CheckExtension(const std::string& extension)
{
	Logger::LogMessage("CheckExtension Start");
	EAllowedExtensions ext = EAllowedExtensions::UNDEFINED;
	if (extension == ".png")
	{
		ext = EAllowedExtensions::PNG;
	}
	else if (extension == ".jpg")
	{
		ext = EAllowedExtensions::JPG;
	}
	else if (extension == ".jpeg")
	{
		ext = EAllowedExtensions::JPEG;
	}
	Logger::LogMessage("CheckExtension End");

	return ext != EAllowedExtensions::UNDEFINED;
}

bool CheckFilter(const std::string& filter)
{
	Logger::LogMessage("CheckFilter Start");
	EDefinedFilters f = EDefinedFilters::UNDEFINED;
	if (filter == "grayscale")
	{
		f = EDefinedFilters::GRAYSCALE;
	}
	else if (filter == "invert")
	{
		f = EDefinedFilters::INVERT;
	}
	else if (filter == "blur")
	{
		f = EDefinedFilters::BLUR;
	}
	Logger::LogMessage("CheckFilter End");

	return f != EDefinedFilters::UNDEFINED;
}