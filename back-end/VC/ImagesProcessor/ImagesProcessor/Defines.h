#pragma once
#include "pch.h"

// Platform-agnostic PI definition
#ifndef M_PI
constexpr float M_PI = 3.14159265358979323846f; /// < Value of Pi
#endif

/**
 * @brief Allowed image file extensions.
 *
 * Supported extensions:
 * - .png
 * - .jpg
 * - .jpeg
 */
static const std::unordered_map<std::string, EAllowedExtensions> g_kAllowedExtensions =
{
    {".png", EAllowedExtensions::PNG},
    {".jpg", EAllowedExtensions::JPG},
    {".jpeg", EAllowedExtensions::JPEG},
};

/**
 * @brief Defined image filters.
 *
 * Supported filters:
 * - grayscale
 * - invert
 * - blur
 * - sobel
 * - canny
 * - fliphorizontal
 * - flipvertical
 * - sepia
 * - oilpaint
 * - kaleidoscope
 * - mosaic
 * - glitch
 */
static const std::unordered_map<std::string, EDefinedFilters> g_kDefinedFilters =
{
	{"grayscale", EDefinedFilters::GRAYSCALE},
	{"invert", EDefinedFilters::INVERT},
	{"blur", EDefinedFilters::BLUR},
	{"sobel", EDefinedFilters::SOBEL},
	{"canny", EDefinedFilters::CANNY},
	{"fliphorizontal", EDefinedFilters::FLIPHORIZONTAL},
	{"flipvertical", EDefinedFilters::FLIPVERTICAL},
	{"sepia", EDefinedFilters::SEPIA},
	{"oilpaint", EDefinedFilters::OILPAINT},
	{"kaleidoscope", EDefinedFilters::KALEIDOSCOPE},
	{"mosaic", EDefinedFilters::MOSAIC},
	{"glitch", EDefinedFilters::GLITCH},
};

static const size_t kImageQuality = 100; ///< Quality of the jpg image.
constexpr size_t kMaxImageLength = 1024 * 1024 * 10; /// < Maximum image length allowed. 10 MB
