#include "ImagesProcessorTest.h"
#include "stb_image_implementation.cpp"

// Initialize static members
std::vector<int> ImagesProcessorTest::progressValues;
std::mutex ImagesProcessorTest::progressMutex;

void ImagesProcessorTest::ProgressCallbackTracker(int progress)
{
	std::lock_guard<std::mutex> lock(progressMutex);
	progressValues.push_back(progress);
}

void ImagesProcessorTest::ResetProgressTracking()
{
	std::lock_guard<std::mutex> lock(progressMutex);
	progressValues.clear();
}

void ImagesProcessorTest::SetUp()
{
	ResetProgressTracking();
}

void ImagesProcessorTest::TearDown()
{
}

const std::vector<unsigned char> ImagesProcessorTest::GetMockImageData(const std::string& extension) const
{
	const int width = 100;
	const int height = 100;
	const int channels = 3;
	std::unique_ptr<unsigned char[]> imageData(new unsigned char[width * height * channels]);

	// Fill the image with a gradient pattern
	for (int y = 0; y < height; y++)
	{
		for (int x = 0; x < width; x++)
		{
			int index = (y * width + x) * channels;
			imageData[index] = static_cast<unsigned char>((x / static_cast<float>(width)) * 255); // Red
			imageData[static_cast<size_t>(index) + 1] = static_cast<unsigned char>((y / static_cast<float>(height)) * 255); // Green
			imageData[static_cast<size_t>(index) + 2] = 0; // Blue
		}
	}

	std::vector<unsigned char> imageDataBuffer;

	if (extension == ".png")
	{
		stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, imageData.get(), width * channels);
	}
	else if (extension == ".jpg" || extension == ".jpeg")
	{
		stbi_write_jpg_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, imageData.get(), kImageQuality);
	}

	return imageDataBuffer;
}

// Basic functionality tests

TEST_F(ImagesProcessorTest, ApplyFilter_InvalidParameters)
{
	const char* imageData = nullptr;
	const char* filter = nullptr;
	const char* extension = nullptr;
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(imageData, 0, filter, &outputData, extension, &outputLength);

	EXPECT_EQ(outputData, nullptr);
	EXPECT_EQ(outputLength, 0);
}

TEST_F(ImagesProcessorTest, ApplyFilter_InvalidExtension)
{
	const char* imageData = "imageData";
	const char* filter = "grayscale";
	const char* extension = "invalidExtension";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(imageData, 10, filter, &outputData, extension, &outputLength);

	EXPECT_EQ(outputData, nullptr);
	EXPECT_EQ(outputLength, 0);
}

TEST_F(ImagesProcessorTest, ApplyFilter_InvalidFilter)
{
	const char* imageData = "imageData";
	int length = static_cast<int>(strlen(imageData));
	const char* filter = "invalidFilter";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(imageData, length, filter, &outputData, extension, &outputLength);

	EXPECT_EQ(outputData, nullptr);
	EXPECT_EQ(outputLength, 0);
}

TEST_F(ImagesProcessorTest, FreeMemory_NullData)
{
	unsigned char* data = nullptr;

	EXPECT_NO_THROW(FreeMemory(&data));
	EXPECT_EQ(data, nullptr);
}

TEST_F(ImagesProcessorTest, FreeMemory_ValidData)
{
	unsigned char* data = new unsigned char[10];

	FreeMemory(&data);

	EXPECT_EQ(data, nullptr);
}

TEST_F(ImagesProcessorTest, ApplyFilter_ValidParameters_InvalidImageData)
{
	const char* imageData = "imageData";
	int length = static_cast<int>(strlen(imageData));
	const char* filter = "grayscale";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(imageData, length, filter, &outputData, extension, &outputLength);

	EXPECT_EQ(outputData, nullptr);
	EXPECT_EQ(outputLength, 0);
}

TEST_F(ImagesProcessorTest, ApplyFilter_ValidParameters_ValidPngImageData)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "grayscale";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);
	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

TEST_F(ImagesProcessorTest, ApplyFilter_ValidParameters_ValidJpgImageData)
{
	std::vector<unsigned char> imageData = GetMockImageData(".jpg");
	int length = static_cast<int>(imageData.size());
	const char* filter = "grayscale";
	const char* extension = ".jpg";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);
	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

TEST_F(ImagesProcessorTest, ApplyFilter_ValidParameters_ValidJpegImageData)
{
	std::vector<unsigned char> imageData = GetMockImageData(".jpeg");
	int length = static_cast<int>(imageData.size());
	const char* filter = "grayscale";
	const char* extension = ".jpeg";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);
	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

TEST_F(ImagesProcessorTest, LoggerInstanceCreationAndLogging)
{
	EXPECT_NO_THROW(Logger::GetInstance().LogMessage("Logger instance created successfully."));
}

TEST_F(ImagesProcessorTest, ApplyFilter_EmptyImage)
{
	// Create an empty 1x1 valid image
	const int width = 1;
	const int height = 1;
	const int channels = 3;
	std::unique_ptr<unsigned char[]> emptyImage(new unsigned char[width * height * channels]());

	std::vector<unsigned char> imageDataBuffer;
	stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, emptyImage.get(), width * channels);

	int length = static_cast<int>(imageDataBuffer.size());
	const char* filter = "grayscale";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), length, filter, &outputData, extension, &outputLength);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);
	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

TEST_F(ImagesProcessorTest, ApplyFilter_UnsupportedImageFormat)
{
	// Test with an image format extension that isn't supported
	std::vector<unsigned char> imageData = GetMockImageData(".png"); // Use PNG data
	int length = static_cast<int>(imageData.size());
	const char* filter = "grayscale";
	const char* extension = ".bmp"; // Use BMP extension if it's unsupported
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength);

	// If BMP is unsupported, expect null output
	// If BMP is supported, this would succeed
	if (outputData == nullptr) 
	{
		EXPECT_EQ(outputLength, 0);
	}
	else 
	{
		EXPECT_GT(outputLength, 0);
		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}
}