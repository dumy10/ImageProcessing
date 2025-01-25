#pragma once
#include <cstdint>

/**
 * @brief Enum class for defined image filters.
 */
enum class EDefinedFilters : uint8_t
{
	UNDEFINED,  ///< Undefined filter.
	GRAYSCALE,  ///< Grayscale filter.
	INVERT,     ///< Invert filter.
	BLUR,       ///< Blur filter.
	SOBEL,      ///< Sobel filter.
	CANNY,       ///< Canny filter.
	FLIPHORIZONTAL,       ///< Flip horizontal filter.
	FLIPVERTICAL,       ///< Flip vertical filter.
};