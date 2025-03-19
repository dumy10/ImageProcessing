#pragma once
#include <cstdint>
#include <string>
#include <unordered_map>

/**
 * @brief Enum class for defined image filters.
 */
enum class EDefinedFilters : uint8_t
{
	UNDEFINED,					///< Undefined filter.
	GRAYSCALE,					///< Grayscale filter.
	INVERT,						///< Invert filter.
	BLUR,						///< Blur filter.
	SOBEL,						///< Sobel filter.
	CANNY,						///< Canny filter.
	FLIPHORIZONTAL,				///< Flip horizontal filter.
	FLIPVERTICAL,				///< Flip vertical filter.
	SEPIA,						///< Sepia filter.
	OILPAINT,					///< Oil paint filter.
	KALEIDOSCOPE,				///< Kaleidoscope filter.
	MOSAIC,						///< Mosaic filter.
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
};