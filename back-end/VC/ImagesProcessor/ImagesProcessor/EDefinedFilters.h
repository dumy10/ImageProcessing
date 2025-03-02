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
};