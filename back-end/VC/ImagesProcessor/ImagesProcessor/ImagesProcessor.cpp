#include "pch.h"
#include "ImagesProcessor.h"

void ApplyFilter(const char* imageData, int length, const char* filter, unsigned char** outputData, const char* extension, int* outputLength)
{
	Logger::GetInstance().LogMessage("ApplyFilter Start");

	// Check if the parameters received are valid
	if (!imageData || length <= 0 || !filter || !extension)
	{
		Logger::GetInstance().LogError("Invalid parameters received.");
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	// Check if the image data received is too large
	if (length > kMaxImageLength)
	{
		Logger::GetInstance().LogWarning("Image data too large: " + std::to_string(length));
		Logger::GetInstance().LogWarning("Filtering will take longer than expected...");
	}

	std::string lowerExtension{ ToLowerCase(extension) };

	// Check if the extension received is allowed
	if (kAllowedExtensions.find(lowerExtension) == kAllowedExtensions.end())
	{
		Logger::GetInstance().LogError("Extension not allowed: " + std::string{ lowerExtension });
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	std::string lowerFilter{ ToLowerCase(filter) };

	// Check if the filter received is allowed
	if (kDefinedFilters.find(lowerFilter) == kDefinedFilters.end())
	{
		Logger::GetInstance().LogError("Filter not allowed: " + std::string{ filter });
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}
	Logger::GetInstance().LogMessage("Applying filter: " + std::string{ lowerFilter } + " to image data of length: " + std::to_string(length));
	Logger::GetInstance().LogMessage("Image data size: " + std::to_string(((static_cast<double>(length) / 1024.0) / 1024.0)) + " MB");
	Logger::GetInstance().LogMessage("Output data will be stored in: " + std::string{ lowerExtension } + " format");

	try
	{
		// Create an ImageData object with the received data
		std::unique_ptr<ImageData> image = std::make_unique<ImageData>(reinterpret_cast<const unsigned char*>(imageData), length, lowerExtension);

		// Filter the image data
		image->FilterImage(kDefinedFilters.at(lowerFilter), outputData, outputLength);
	}
	catch (const std::exception& e)
	{
		Logger::GetInstance().LogError("Exception caught: " + std::string{ e.what() });
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	Logger::GetInstance().LogMessage("Output data size: " + std::to_string(((static_cast<double>(*outputLength) / 1024.0) / 1024.0)) + " MB");
	Logger::GetInstance().LogMessage("ApplyFilter End");
}


void FreeMemory(unsigned char** data)
 {
	Logger::GetInstance().LogMessage("FreeMemory Start");

	if (!data || !(*data))
	{
		Logger::GetInstance().LogError("FreeMemory called with null data.");
		return;
	}

	// Additional check: Ensure the pointer is within a valid range
	if (!IsValidPointer(*data))
	{
		Logger::GetInstance().LogError("FreeMemory called with corrupted data pointer.");
		return;
	}

	Logger::GetInstance().LogMessage("Freeing memory for received data.");

	delete[] * data;
	*data = nullptr;

	Logger::GetInstance().LogMessage("FreeMemory End");
}

std::string ToLowerCase(const std::string& input)
{
	std::string result{ input };
	std::transform(result.begin(), result.end(), result.begin(), ::tolower);
	return result;
}

bool IsValidPointer(void* pointer)
{
	MEMORY_BASIC_INFORMATION mbi;
	if (VirtualQuery(pointer, &mbi, sizeof(mbi)))
	{
		DWORD mask = (PAGE_READWRITE | PAGE_EXECUTE_READWRITE | PAGE_WRITECOPY | PAGE_EXECUTE_WRITECOPY);
		bool isValid = (mbi.State == MEM_COMMIT) && (mbi.Protect & mask);
		return isValid;
	}
	return false;
}
