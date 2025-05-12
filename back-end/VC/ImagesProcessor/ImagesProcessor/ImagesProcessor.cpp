#include "pch.h"
#include "ImagesProcessor.h"

void ApplyFilter(const char* imageData, int length, const char* filter, unsigned char** outputData, const char* extension, int* outputLength, ProgressCallback progressCallback)
{
	Logger::GetInstance().LogMessage("ApplyFilter Start");

	// Report initial progress
	ReportProgressIfNeeded(progressCallback, 0);

	if (!ValidateParameters(imageData, length, filter, extension))
	{
		Logger::GetInstance().LogError("Invalid parameters received.");
		*outputLength = 0;
		*outputData = nullptr;

		// Report error as failed progress
		ReportProgressIfNeeded(progressCallback, 100);
		return;
	}

	// Report progress at 10%
	ReportProgressIfNeeded(progressCallback, 10);

	std::string lowerFilter{ ToLowerCase(filter) };
	std::string lowerExtension{ ToLowerCase(extension) };

	Logger::GetInstance().LogMessage("Applying filter: " + lowerFilter + " to image data of length: " + std::to_string(length));
	Logger::GetInstance().LogMessage("Image data size: " + std::to_string(((static_cast<double>(length) / 1024.0) / 1024.0)) + " MB");
	Logger::GetInstance().LogMessage("Output data will be stored in: " + lowerExtension + " format");

	try
	{
		// Create an ImageData object with the received data
		std::unique_ptr<ImageData> image = std::make_unique<ImageData>(reinterpret_cast<const unsigned char*>(imageData), length, lowerExtension);

		// The image was loaded successfully, report progress at 40%
		ReportProgressIfNeeded(progressCallback, 40);

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
		ReportProgressIfNeeded(progressCallback, 100);
		return;
	}

	ReportProgressIfNeeded(progressCallback, 100);

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

bool ValidateParameters(const char* imageData, int length, const char* filter, const char* extension)
{
	if (!imageData || length <= 0 || !filter || !extension)
	{
		Logger::GetInstance().LogError("Invalid parameters received.");
		return false;
	}
	if (length > kMaxImageLength)
	{
		Logger::GetInstance().LogWarning("Image data too large: " + std::to_string(length));
		Logger::GetInstance().LogWarning("Filtering will take longer than expected...");
	}
	std::string lowerExtension{ ToLowerCase(extension) };
	if (g_kAllowedExtensions.find(lowerExtension) == g_kAllowedExtensions.end())
	{
		Logger::GetInstance().LogError("Extension not allowed: " + std::string{ lowerExtension });
		return false;
	}
	std::string lowerFilter{ ToLowerCase(filter) };
	if (g_kDefinedFilters.find(lowerFilter) == g_kDefinedFilters.end())
	{
		Logger::GetInstance().LogError("Filter not allowed: " + std::string{ filter });
		return false;
	}
	return true;
}
