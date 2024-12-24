#pragma once
#include "pch.h"
#include <stb_image.h>
#include <stb_image_write.h>
#include <omp.h>

static const std::unordered_map<std::string, EAllowedExtensions> kAllowedExtensions =
{
	{".png", EAllowedExtensions::PNG},
	{".jpg", EAllowedExtensions::JPG},
	{".jpeg", EAllowedExtensions::JPEG},
};

static const std::unordered_map<std::string, EDefinedFilters> kDefinedFilters =
{
	{"grayscale", EDefinedFilters::GRAYSCALE},
	{"invert", EDefinedFilters::INVERT},
	{"blur", EDefinedFilters::BLUR},
	{"sobel", EDefinedFilters::SOBEL},
	{"canny", EDefinedFilters::CANNY}
};

static stbi_write_func* kWriteCallback = [](void* context, void* data, int size) {
	std::vector<unsigned char>* buffer = reinterpret_cast<std::vector<unsigned char>*>(context);
	unsigned char* bytes = reinterpret_cast<unsigned char*>(data);
	buffer->insert(buffer->end(), bytes, bytes + size);
	};

class ImageData
{
public:
	ImageData(const unsigned char* imageData, int length, const std::string& extension);
	~ImageData();

public:
	void FilterImage(EDefinedFilters filter, unsigned char** outputData, int* outputLength) const;

private:
	void ApplyGrayscaleFilter(unsigned char* outputImage) const;
	void ApplyInvertFilter(unsigned char* outputImage) const;
	void ApplyBlurFilter(unsigned char* outputImage) const;
	void ApplySobelFilter(unsigned char* outputImage) const;
	void ApplyCannyFilter(unsigned char* outputImage) const;
	void WriteToMemory(unsigned char* outputImage, std::vector<unsigned char>* encodedData) const;

private:
	std::string m_extension;
private:
	unsigned char* m_imageData;
private:
	int m_width;
	int m_height;
	int m_channels;
	int m_imageSize;
};