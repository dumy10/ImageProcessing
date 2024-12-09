#pragma once
#include "pch.h"

extern "C" void ApplyFilter(const char* imageData, int length, const char* filter, unsigned char* outputData, const char* extension, int* outputLength);