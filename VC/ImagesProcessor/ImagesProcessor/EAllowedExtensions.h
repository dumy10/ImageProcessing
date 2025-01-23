#pragma once
#include <cstdint>

/**
 * @brief Enum class for allowed image file extensions.
 */
enum class EAllowedExtensions : uint8_t
{
    UNDEFINED, ///< Undefined file extension.
    PNG,       ///< PNG file extension.
    JPG,       ///< JPG file extension.
    JPEG       ///< JPEG file extension.
};