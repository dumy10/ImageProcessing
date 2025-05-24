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
	GLITCH,						///< Glitch filter.
	SHARPEN,					///< Sharpen filter.
};
