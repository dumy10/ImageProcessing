#include "pch.h"
#include "ImagesProcessor.h"

void ApplyFilter(const char* imageData, int length, const char* filter, unsigned char** outputData, const char* extension, int* outputLength, ProgressCallback progressCallback)
{
	Logger::GetInstance().LogMessage("ApplyFilter Start");

	// Report initial progress
	if (progressCallback)
	{
		Logger::GetInstance().LogMessage("Progress callback provided.");
		progressCallback(0);
	}

	// Check if the parameters received are valid
	if (!imageData || length <= 0 || !filter || !extension)
	{
		Logger::GetInstance().LogError("Invalid parameters received.");
		*outputLength = 0;
		*outputData = nullptr;

		// Report error as failed progress
		if (progressCallback)
			progressCallback(100);
		return;
	}

	// Check if the image data received is too large
	if (length > kMaxImageLength)
	{
		Logger::GetInstance().LogWarning("Image data too large: " + std::to_string(length));
		Logger::GetInstance().LogWarning("Filtering will take longer than expected...");
	}

	// Report progress at 5% - parameters validated
	if (progressCallback)
		progressCallback(5);

	std::string lowerExtension{ ToLowerCase(extension) };

	// Check if the extension received is allowed
	if (g_kAllowedExtensions.find(lowerExtension) == g_kAllowedExtensions.end())
	{
		Logger::GetInstance().LogError("Extension not allowed: " + std::string{ lowerExtension });
		*outputLength = 0;
		*outputData = nullptr;

		// Report error as failed progress
		if (progressCallback)
			progressCallback(100);
		return;
	}

	std::string lowerFilter{ ToLowerCase(filter) };

	// Check if the filter received is allowed
	if (g_kDefinedFilters.find(lowerFilter) == g_kDefinedFilters.end())
	{
		Logger::GetInstance().LogError("Filter not allowed: " + std::string{ filter });
		*outputLength = 0;
		*outputData = nullptr;

		// Report error as failed progress
		if (progressCallback)
			progressCallback(100);
		return;
	}

	// Report progress at 10% - filter and extension validated
	if (progressCallback)
		progressCallback(10);

	Logger::GetInstance().LogMessage("Applying filter: " + std::string{ lowerFilter } + " to image data of length: " + std::to_string(length));
	Logger::GetInstance().LogMessage("Image data size: " + std::to_string(((static_cast<double>(length) / 1024.0) / 1024.0)) + " MB");
	Logger::GetInstance().LogMessage("Output data will be stored in: " + std::string{ lowerExtension } + " format");

	try
	{
		// Create an ImageData object with the received data
		std::unique_ptr<ImageData> image = std::make_unique<ImageData>(reinterpret_cast<const unsigned char*>(imageData), length, lowerExtension);

		// The image was loaded successfully, report progress at 40%
		if (progressCallback)
			progressCallback(40);

		double start = omp_get_wtime();

		// Filter the image data with optional progress tracking
		image->FilterImage(g_kDefinedFilters.at(lowerFilter), outputData, outputLength, progressCallback);

		double end = omp_get_wtime();

		Logger::GetInstance().LogMessage("Filtering took: " + std::to_string(end - start) + " seconds");
	}
	catch (const std::exception& e)
	{
		Logger::GetInstance().LogError("Exception caught: " + std::string{ e.what() });
		*outputLength = 0;
		*outputData = nullptr;

		// Report error as failed progress
		if (progressCallback)
			progressCallback(100);
		return;
	}

	if (progressCallback)
	{
		Logger::GetInstance().LogMessage("Progress callback completed.");
		progressCallback(100);
	}

	Logger::GetInstance().LogMessage("Output data size: " + std::to_string(((static_cast<double>(*outputLength) / 1024.0) / 1024.0)) + " MB");
	Logger::GetInstance().LogMessage("ApplyFilter End");
}

void FreeMemory(unsigned char** data)
{
	if (!data || !*data)
		return;

	delete[] * data;
	*data = nullptr;
}

bool ProcessDummyTest()
{
	try
	{
		std::string logMessage = "Dummy test passed.";
		Logger::GetInstance().LogMessage(logMessage);

		return true;
	}
	catch (const std::exception& e)
	{
		Logger::GetInstance().LogError("Dummy test failed: " + std::string{ e.what() });

		return false;
	}
}

std::string ToLowerCase(const std::string& input)
{
	std::string result = input;
	std::transform(result.begin(), result.end(), result.begin(),
		[](unsigned char c) { return std::tolower(c); });
	return result;
}

bool IsValidPointer(void* pointer)
{
#if defined(_WIN32) || defined(_WIN64)
	// Windows-specific pointer validation
	if (pointer == nullptr)
		return false;

	MEMORY_BASIC_INFORMATION mbi;
	if (VirtualQuery(pointer, &mbi, sizeof(mbi)) == 0)
		return false;

	if (mbi.State != MEM_COMMIT)
		return false;

	return true;
#else
	// Simple null check for Linux
	return pointer != nullptr;
#endif
}
