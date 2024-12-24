#include "pch.h"
#include "ImageData.h"

ImageData::ImageData(const unsigned char* imageData, int length, const std::string& extension) : m_extension{ extension }
{
	Logger::LogMessage("Loading image data with extension: " + extension);
	m_imageData = stbi_load_from_memory(reinterpret_cast<const unsigned char*>(imageData), length, &m_width, &m_height, &m_channels, 0);

	if (!m_imageData)
	{
		Logger::LogError("Failed to load image data");
		throw std::runtime_error("Failed to load image data");
	}

	m_imageSize = m_width * m_height * m_channels;

	Logger::LogMessage("Image data loaded successfully to memory.");
}

ImageData::~ImageData()
{
	if (m_imageData)
	{
		Logger::LogMessage("Freeing image data");
		stbi_image_free(m_imageData);
	}
}

void ImageData::FilterImage(EDefinedFilters filter, unsigned char** outputData, int* outputLength) const
{
	Logger::LogMessage("Filtering image data with filter: " + std::move(std::to_string(static_cast<int>(filter))));

	unsigned char* outputImage = new unsigned char[m_imageSize];

	switch (filter)
	{
	case EDefinedFilters::GRAYSCALE:
	{
		this->ApplyGrayscaleFilter(outputImage);
		break;
	}
	case EDefinedFilters::INVERT:
	{
		this->ApplyInvertFilter(outputImage);
		break;
	}
	case EDefinedFilters::BLUR:
	{
		this->ApplyBlurFilter(outputImage);
		break;
	}
	case EDefinedFilters::SOBEL:
	{
		this->ApplySobelFilter(outputImage);
		break;
	}
	case EDefinedFilters::CANNY:
	{
		this->ApplyCannyFilter(outputImage);
		break;
	}
	default:
	{
		Logger::LogError("Unknown filter received: " + std::move(std::to_string(static_cast<int>(filter))));
		Logger::LogError("Filtering image data failed");
		Logger::LogError("Deleting allocated memory");
		delete[] outputImage;
		outputImage = nullptr;
		*outputLength = 0;
		*outputData = nullptr;
		return;
		break;
	}
	}

	std::vector<unsigned char> encodedData;

	this->WriteToMemory(outputImage, &encodedData);

	if (!outputImage || encodedData.empty())
	{
		Logger::LogError("Filtering image data failed");
		Logger::LogError("Deleting allocated memory");
		delete[] outputImage;
		outputImage = nullptr;
		*outputLength = 0;
		*outputData = nullptr;
		return;
	}

	*outputLength = static_cast<int>(encodedData.size());
	*outputData = new unsigned char[*outputLength];

	std::memcpy(*outputData, encodedData.data(), *outputLength);

	delete[] outputImage;
	outputImage = nullptr;

	Logger::LogMessage("Image data filtered successfully");
}

void ImageData::ApplyGrayscaleFilter(unsigned char* outputImage) const
{
	Logger::LogMessage("Applying grayscale filter");
	for (int i = 0; i < m_imageSize; i += m_channels)
	{
		unsigned char r = m_imageData[i];
		unsigned char g = m_imageData[i + 1];
		unsigned char b = m_imageData[i + 2];
		unsigned char gray = static_cast<unsigned char>(r * 0.3f + g * 0.59f + b * 0.11f);
		outputImage[i] = gray;
		if (m_channels > 1 && i + 1 < m_imageSize) outputImage[i + 1] = gray; // Ensure buffer overflow does not happen
		if (m_channels > 2 && i + 2 < m_imageSize) outputImage[i + 2] = gray;
	}
	Logger::LogMessage("Grayscale filter applied successfully");
}

void ImageData::ApplyInvertFilter(unsigned char* outputImage) const
{
	Logger::LogMessage("Applying invert filter");
	for (int i = 0; i < m_imageSize; i += m_channels)
	{
		unsigned char r = m_imageData[i];
		unsigned char g = m_imageData[i + 1];
		unsigned char b = m_imageData[i + 2];
		outputImage[i] = 255 - r;
		if (m_channels > 1 && i + 1 < m_imageSize) outputImage[i + 1] = 255 - g; // Ensure buffer overflow does not happen
		if (m_channels > 2 && i + 2 < m_imageSize) outputImage[i + 2] = 255 - b;
	}
	Logger::LogMessage("Invert filter applied successfully");
}

void ImageData::ApplyBlurFilter(unsigned char* outputImage) const
{
	Logger::LogMessage("Applying blur filter");

	int kernelSize = 7; // The kernel defines how much blur the image will have.
	int halfKernel = kernelSize / 2;

	unsigned char* tempImage = new unsigned char[m_imageSize];

	// Parallel horizontal pass
	Logger::LogMessage("Parallel horizontal pass");
#pragma warning(push)
#pragma warning(disable : 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
	// At least as it looks like, the pragma is working as expected and the code should still run in parallel
#pragma omp parallel for
	for (int y = 0; y < m_height; y++)
	{
		for (int x = 0; x < m_width; x++)
		{
			float sum[4] = { 0 };
			int count = 0;

			for (int k = -halfKernel; k <= halfKernel; ++k)
			{
				int sampleX = x + k;

				if (sampleX >= 0 && sampleX < m_width)
				{
					int sampleIndex = (y * m_width + sampleX) * m_channels;

					for (int c = 0; c < m_channels; c++)
					{
						sum[c] += m_imageData[sampleIndex + c];
					}
					count++;
				}
			}

			int index = (y * m_width + x) * m_channels;
			for (int c = 0; c < m_channels; c++)
			{
				if (index + c < m_imageSize) // Ensure buffer overflow does not happen
				{
					tempImage[index + c] = static_cast<unsigned char>(sum[c] / count);
				}
			}
		}
	}
	Logger::LogMessage("Parallel vertical pass");
	// Parallel vertical pass
#pragma omp parallel for
	for (int y = 0; y < m_height; y++)
	{
		for (int x = 0; x < m_width; x++)
		{
			float sum[4] = { 0 };
			int count = 0;

			for (int k = -halfKernel; k <= halfKernel; k++)
			{
				int sampleY = y + k;

				if (sampleY >= 0 && sampleY < m_height)
				{
					int sampleIndex = (sampleY * m_width + x) * m_channels;

					for (int c = 0; c < m_channels; c++)
					{
						sum[c] += tempImage[sampleIndex + c];
					}
					count++;
				}
			}

			int index = (y * m_width + x) * m_channels;
			for (int c = 0; c < m_channels; c++)
			{
				if (index + c < m_imageSize) // Ensure buffer overflow does not happen
				{
					outputImage[index + c] = static_cast<unsigned char>(sum[c] / count);
				}
			}
		}
	}
#pragma warning(pop) // Restore warning settings
	delete[] tempImage;
	tempImage = nullptr;

	Logger::LogMessage("Blur filter applied successfully");
}

void ImageData::ApplySobelFilter(unsigned char* outputImage) const
{
	// Sobel filter is a combination of two 3x3 convolution filters
	// The first filter is used to calculate the gradient in the x-direction
	// The second filter is used to calculate the gradient in the y-direction
	// The final gradient is calculated as the square root of the sum of the squares of the gradients in the x and y directions
	// The final gradient is then thresholded to get the final image

	Logger::LogMessage("Applying Sobel filter");

	// Sobel filter kernels
	int kernelX[3][3] = { { -1, 0, 1 },{ -2, 0, 2 },{ -1, 0, 1 } };
	int kernelY[3][3] = { { -1, -2, -1 },{ 0, 0, 0 },{ 1, 2, 1 } };

	unsigned char* tempImage = new unsigned char[m_imageSize];

	// Parallel horizontal pass
#pragma warning(push)
#pragma warning(disable : 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
								// At least as it looks like, the pragma is working as expected and the code should still run in parallel
#pragma omp parallel for
	for (int y = 0; y < m_height; y++)
	{
		for (int x = 0; x < m_width; x++)
		{
			float sumX[4] = { 0 };
			float sumY[4] = { 0 };
			for (int i = -1; i <= 1; i++)
			{
				for (int j = -1; j <= 1; j++)
				{
					int sampleX = x + j;
					int sampleY = y + i;
					if (sampleX >= 0 && sampleX < m_width && sampleY >= 0 && sampleY < m_height)
					{
						int sampleIndex = (sampleY * m_width + sampleX) * m_channels;
						for (int c = 0; c < m_channels; c++)
						{
							sumX[c] += m_imageData[sampleIndex + c] * kernelX[i + 1][j + 1];
							sumY[c] += m_imageData[sampleIndex + c] * kernelY[i + 1][j + 1];
						}
					}
				}
			}
			int index = (y * m_width + x) * m_channels;
			for (int c = 0; c < m_channels; c++)
			{
				if (index + c < m_imageSize) // Ensure buffer overflow does not happen
				{
					tempImage[index + c] = static_cast<unsigned char>(std::sqrt(sumX[c] * sumX[c] + sumY[c] * sumY[c]));
				}
			}
		}
	}
	// Parallel vertical pass
#pragma omp parallel for
	for (int y = 0; y < m_height; y++)
	{
		for (int x = 0; x < m_width; x++)
		{
			float sumX[4] = { 0 };
			float sumY[4] = { 0 };
			for (int i = -1; i <= 1; i++)
			{
				for (int j = -1; j <= 1; j++)
				{
					int sampleX = x + j;
					int sampleY = y + i;
					if (sampleX >= 0 && sampleX < m_width && sampleY >= 0 && sampleY < m_height)
					{
						int sampleIndex = (sampleY * m_width + sampleX) * m_channels;
						for (int c = 0; c < m_channels; c++)
						{
							sumX[c] += tempImage[sampleIndex + c] * kernelX[i + 1][j + 1];
							sumY[c] += tempImage[sampleIndex + c] * kernelY[i + 1][j + 1];
						}
					}
				}
			}
			int index = (y * m_width + x) * m_channels;
			for (int c = 0; c < m_channels; c++)
			{
				if (index + c < m_imageSize) // Ensure buffer overflow does not happen
				{
					outputImage[index + c] = static_cast<unsigned char>(std::sqrt(sumX[c] * sumX[c] + sumY[c] * sumY[c]));
				}
			}
		}
	}
#pragma warning(pop) // Restore warning settings
	delete[] tempImage;
	tempImage = nullptr;
	Logger::LogMessage("Sobel filter applied successfully");
}

// This is a placeholder for the Canny filter
void ImageData::ApplyCannyFilter(unsigned char* outputImage) const
{
	Logger::LogMessage("Applying Canny filter");
	for (int i = 0; i < m_imageSize; i += m_channels)
	{
		unsigned char r = m_imageData[i];
		unsigned char g = m_imageData[i + 1];
		unsigned char b = m_imageData[i + 2];
		outputImage[i] = r;
		if (m_channels > 1 && i + 1 < m_imageSize) outputImage[i + 1] = g; // Ensure buffer overflow does not happen
		if (m_channels > 2 && i + 2 < m_imageSize) outputImage[i + 2] = b;
	}
	Logger::LogMessage("Canny filter applied successfully");
}

void ImageData::WriteToMemory(unsigned char* outputImage, std::vector<unsigned char>* encodedData) const
{
	Logger::LogMessage("Writing image data to memory");
	if (m_extension == ".png")
	{
		if (!stbi_write_png_to_func(kWriteCallback, encodedData, m_width, m_height, m_channels, outputImage, m_width * m_channels))
		{
			Logger::LogError("Failed to encode image data as " + std::move(m_extension));
			delete[] outputImage;
			outputImage = nullptr;
		}
	}
	else if (m_extension == ".jpg" || m_extension == ".jpeg")
	{
		if (!stbi_write_jpg_to_func(kWriteCallback, encodedData, m_width, m_height, m_channels, outputImage, m_width * m_channels))
		{
			Logger::LogError("Failed to encode image data as " + std::move(m_extension));
			delete[] outputImage;
			outputImage = nullptr;
		}
	}
	else
	{
		Logger::LogError("Extension not supported: " + std::move(m_extension));
		delete[] outputImage;
		outputImage = nullptr;
	}
	Logger::LogMessage("Image data written to memory successfully");
}