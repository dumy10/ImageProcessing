#pragma once
#include "pch.h"
#include "ImageData.h"

constexpr size_t kMaxImageLength = 1024 * 1024 * 50; // 50 MB

extern "C" IMAGESPROCESSOR_API void ApplyFilter(const char* imageData, int length, const char* filter, unsigned char** outputData, const char* extension, int* outputLength);
extern "C" IMAGESPROCESSOR_API void FreeMemory(unsigned char* data);

std::string ToLowerCase(const std::string& input);