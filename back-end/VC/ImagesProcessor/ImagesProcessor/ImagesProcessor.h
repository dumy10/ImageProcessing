#pragma once
#include "pch.h"
#include "ImageData.h"
#include "libdefine.h"

constexpr size_t kMaxImageLength = 1024 * 1024 * 10; /// < Maximum image length allowed. 10 MB

#ifdef __cplusplus
extern "C" {
#endif

	/**
	 * @brief Applies a specified filter to the given image data.
	 *
	 * @param imageData Pointer to the image data.
	 * @param length Length of the image data.
	 * @param filter Name of the filter to apply.
	 * @param outputData Pointer to the output data.
	 * @param extension File extension of the image.
	 * @param outputLength Pointer to the length of the output data.
	 * @param progressCallback Optional callback function for reporting progress. Default is nullptr.
	 */
	IMAGESPROCESSOR_API void ApplyFilter(const char* imageData, int length, const char* filter,
		unsigned char** outputData, const char* extension,
		int* outputLength, ProgressCallback progressCallback = nullptr);

	/**
	 * @brief Frees memory allocated by the ApplyFilter function.
	 *
	 * @param data Pointer to the memory to free.
	 */
	IMAGESPROCESSOR_API void FreeMemory(unsigned char** data);

	/**
	  *@brief Dummy test function to check if the library is working correctly.
	*/
	IMAGESPROCESSOR_API bool ProcessDummyTest();

#ifdef __cplusplus
}
#endif

/**
 * @brief Validates the parameters received by the ApplyFilter function.
 *
 * @param imageData Pointer to the image data.
 * @param length Length of the image data.
 * @param filter Name of the filter to apply.
 * @param extension File extension of the image.
 * @return True if the parameters are valid, false otherwise.
 */
bool ValidateParameters(const char* imageData, int length, const char* filter, const char* extension);
