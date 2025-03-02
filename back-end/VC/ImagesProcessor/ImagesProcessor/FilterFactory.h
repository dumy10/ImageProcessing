#pragma once
#include "pch.h"
#include "AllFilters.h"

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
	static std::unique_ptr<IFilter> CreateFilter(EDefinedFilters filterType);

private:
	/**
	 * @brief Type alias for a function that creates a unique pointer to an IFilter.
	 *
	 * This type alias defines a function signature for creating instances of filters.
	 */
	using FilterCreator = std::function<std::unique_ptr<IFilter>()>;

	/**
	 * @brief Map of filter types to their corresponding creation functions.
	 *
	 * This map associates each filter type with a function that creates an instance
	 * of the corresponding filter.
	 */
	static const std::unordered_map<EDefinedFilters, FilterCreator> filterMap;
};