#pragma once
#include <cstdint>
#include <string>
enum class EDefinedFilters : uint8_t
{
	UNDEFINED,
	GRAYSCALE,
	INVERT,
	BLUR
};

inline EDefinedFilters FilterFromString(const std::string& filter)
{
	if (filter == "grayscale")
	{
		return EDefinedFilters::GRAYSCALE;
	}
	else if (filter == "invert")
	{
		return EDefinedFilters::INVERT;
	}
	else if (filter == "blur")
	{
		return EDefinedFilters::BLUR;
	}
	return EDefinedFilters::UNDEFINED;
}