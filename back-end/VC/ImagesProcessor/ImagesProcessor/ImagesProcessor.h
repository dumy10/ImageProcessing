#pragma once
#include "pch.h"
#include "ImageData.h"

extern "C" IMAGESPROCESSOR_API void ApplyFilter(const char* imageData, int length, const char* filter, unsigned char** outputData, const char* extension, int* outputLength);
extern "C" IMAGESPROCESSOR_API void FreeMemory(unsigned char* data);