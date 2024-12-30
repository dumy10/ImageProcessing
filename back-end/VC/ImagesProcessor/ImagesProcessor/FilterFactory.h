#pragma once
#include <memory>
#include "GrayscaleFilter.h"
#include "InvertFilter.h"
#include "BlurFilter.h"
#include "SobelFilter.h"
#include "CannyFilter.h"

/**
 * @brief Factory class for creating image filters.
 * 
 * This class provides a method to create instances of different image filters
 * based on the specified filter type.
 */
class FilterFactory
{
public:
    /**
     * @brief Creates an image filter based on the specified filter type.
     * 
     * This method returns a unique pointer to an IFilter instance corresponding
     * to the given filter type.
     * 
     * @param filterType The type of filter to create.
     * @return std::unique_ptr<IFilter> A unique pointer to the created filter.
     * @throws std::invalid_argument if the filter type is unknown.
     */
    static inline std::unique_ptr<IFilter> CreateFilter(EDefinedFilters filterType)
    {
        switch (filterType)
        {
        case EDefinedFilters::GRAYSCALE:
            return std::make_unique<GrayscaleFilter>();
        case EDefinedFilters::INVERT:
            return std::make_unique<InvertFilter>();
        case EDefinedFilters::BLUR:
            return std::make_unique<BlurFilter>();
        case EDefinedFilters::SOBEL:
            return std::make_unique<SobelFilter>();
        case EDefinedFilters::CANNY:
            return std::make_unique<CannyFilter>();
        default:
            throw std::invalid_argument("Unknown filter type");
        }
    }
};
