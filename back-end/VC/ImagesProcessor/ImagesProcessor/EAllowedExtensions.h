#pragma once
#include <cstdint>
#include <string>
#include <unordered_map>

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