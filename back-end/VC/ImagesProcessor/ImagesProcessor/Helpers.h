#pragma once
#include "pch.h"

/**
 * @brief Callback function type for reporting progress.
 * @param progress Progress value between 0 and 100.
 */
typedef void (*ProgressCallback)(int progress);

/**
 * @brief Reports progress if a callback is provided.
 * @param progressCallback The progress callback function.
 * @param progress The current progress value.
 */
void ReportProgressIfNeeded(const ProgressCallback& progressCallback, int progress);

/**
 * @brief Converts a string to lowercase.
 *
 * @param input The string to convert.
 * @return The lowercase string.
 */
std::string ToLowerCase(const std::string& input);

/**
 * @brief Checks if a pointer is valid.
 *
 * @param pointer The pointer to check.
 * @return True if the pointer is valid, false otherwise.
 */
bool IsValidPointer(void* pointer);