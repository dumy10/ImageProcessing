#pragma once
#include "pch.h"
#include "ImageData.h"

constexpr size_t kMaxImageLength = 1024 * 1024 * 50; /// < Maximum image length allowed. 50 MB

/**
 * @brief Applies a specified filter to the given image data.
 *
 * @param imageData Pointer to the image data.
 * @param length Length of the image data.
 * @param filter Name of the filter to apply.
 * @param outputData Pointer to the output data.
 * @param extension File extension of the image.
 * @param outputLength Pointer to the length of the output data.
 */
extern "C" IMAGESPROCESSOR_API void ApplyFilter(const char* imageData, int length, const char* filter, unsigned char** outputData, const char* extension, int* outputLength);

/**
 * @brief Frees the allocated memory for the image data.
 *
 * @param data Pointer to the data to be freed.
 */
extern "C" IMAGESPROCESSOR_API void FreeMemory(unsigned char** data);

/**
 * @brief Converts a given string to lowercase.
 *
 * @param input The input string to convert.
 * @return The converted lowercase string.
 */
std::string ToLowerCase(const std::string& input);

/**
 * @brief Checks if a given pointer is valid.
 *
 * @param pointer The pointer to check.
 * @return True if the pointer is valid, false otherwise.
 */
bool IsValidPointer(void* pointer);