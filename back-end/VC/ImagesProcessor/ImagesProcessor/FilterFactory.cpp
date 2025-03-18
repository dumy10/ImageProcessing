#include "pch.h"
#include "FilterFactory.h"

const std::unordered_map<EDefinedFilters, FilterFactory::FilterCreator> FilterFactory::filterMap =
{
	{EDefinedFilters::GRAYSCALE, []() { return std::make_unique<GrayscaleFilter>(); }},
	{EDefinedFilters::INVERT, []() { return std::make_unique<InvertFilter>(); }},
	{EDefinedFilters::BLUR, []() { return std::make_unique<BlurFilter>(); }},
	{EDefinedFilters::SOBEL, []() { return std::make_unique<SobelFilter>(); }},
	{EDefinedFilters::CANNY, []() { return std::make_unique<CannyFilter>(); }},
	{EDefinedFilters::FLIPHORIZONTAL, []() { return std::make_unique<FlipHorizontalFilter>(); }},
	{EDefinedFilters::FLIPVERTICAL, []() { return std::make_unique<FlipVerticalFilter>(); }},
	{EDefinedFilters::SEPIA, []() { return std::make_unique<SepiaFilter>(); }},
	{EDefinedFilters::OILPAINT, []() { return std::make_unique<OilPaintFilter>(); }},
	{EDefinedFilters::KALEIDOSCOPE, []() { return std::make_unique<KaleidoscopeFilter>(); }},
};

std::unique_ptr<IFilter> FilterFactory::CreateFilter(EDefinedFilters filterType)
{
	const auto it = filterMap.find(filterType);
	if (it != filterMap.end())
	{
		return it->second();
	}
	throw std::invalid_argument("Unknown filter received by the filter factory.");
}
