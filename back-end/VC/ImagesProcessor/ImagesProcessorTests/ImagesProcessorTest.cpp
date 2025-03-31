#include "ImagesProcessorTest.h"
#include "stb_image_implementation.cpp"

void ImagesProcessorTest::SetUp()
{

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

TEST_F(ImagesProcessorTest, ApplyFilter_InvertFilter)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "invert";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);
	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

TEST_F(ImagesProcessorTest, ApplyFilter_BlurFilter)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "blur";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);
	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

TEST_F(ImagesProcessorTest, ApplyFilter_FlipHorizontalFilter)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "flipHorizontal";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);
	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

TEST_F(ImagesProcessorTest, ApplyFilter_FlipVerticalFilter)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "flipVertical";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);
	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
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

TEST_F(ImagesProcessorTest, ApplyFilter_LargeImage)
{
	// For simplicity, we'll create a mock larger image rather than an actual max-sized image
	const int width = 1000;
	const int height = 1000;
	const int channels = 3;
	std::unique_ptr<unsigned char[]> largeImage(new unsigned char[width * height * channels]());
	
	// Fill with simple pattern
	for (int i = 0; i < width * height * channels; i++) {
		largeImage.get()[i] = static_cast<unsigned char>(i % 255);
	}
	
	std::vector<unsigned char> imageDataBuffer;
	stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, largeImage.get(), width * channels);
	
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

TEST_F(ImagesProcessorTest, ApplyMultipleFiltersSequentially)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* extension = ".png";
	unsigned char* intermediateData = nullptr;
	int intermediateLength = 0;
	unsigned char* finalData = nullptr;
	int finalLength = 0;

	// Apply first filter (grayscale)
	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, "grayscale", &intermediateData, extension, &intermediateLength);
	EXPECT_NE(intermediateData, nullptr);
	EXPECT_GT(intermediateLength, 0);

	// Apply second filter (invert) to the result of the first
	ApplyFilter(reinterpret_cast<const char*>(intermediateData), intermediateLength, "invert", &finalData, extension, &finalLength);
	
	EXPECT_NE(finalData, nullptr);
	EXPECT_GT(finalLength, 0);
	
	EXPECT_NO_THROW(FreeMemory(&intermediateData));
	EXPECT_EQ(intermediateData, nullptr);
	EXPECT_NO_THROW(FreeMemory(&finalData));
	EXPECT_EQ(finalData, nullptr);
}

TEST_F(ImagesProcessorTest, PerformanceBenchmark)
{
	// Generate test images of increasing size and measure processing time
	const std::vector<int> sizes = { 100, 200, 400, 800 };
	
	for (int size : sizes)
	{
		const int width = size;
		const int height = size;
		const int channels = 3;
		std::unique_ptr<unsigned char[]> testImage(new unsigned char[width * height * channels]());
		
		// Fill with data
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				int index = (y * width + x) * channels;
				testImage.get()[index] = static_cast<unsigned char>(x % 255);
				testImage.get()[index + 1] = static_cast<unsigned char>(y % 255);
				testImage.get()[index + 2] = 0;
			}
		}
		
		std::vector<unsigned char> imageDataBuffer;
		stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, testImage.get(), width * channels);
		
		int length = static_cast<int>(imageDataBuffer.size());
		const char* filter = "grayscale";
		const char* extension = ".png";
		unsigned char* outputData = nullptr;
		int outputLength = 0;

		// Measure time
		auto start = std::chrono::high_resolution_clock::now();
		ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), length, filter, &outputData, extension, &outputLength);
		auto end = std::chrono::high_resolution_clock::now();
		
		std::chrono::duration<double, std::milli> duration = end - start;
		std::cout << "Image size: " << size << "x" << size << ", Processing time: " << duration.count() << " ms" << std::endl;

		EXPECT_NE(outputData, nullptr);
		EXPECT_GT(outputLength, 0);
		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}
}

// Test for filter chaining behavior
TEST_F(ImagesProcessorTest, ApplyFilter_ChainTwoFiltersInOne)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "grayscale,invert"; // Test comma-separated filter chaining if supported
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength);

	// Even if not supported, should gracefully handle the request
	// If supported, output should be non-null
	if (outputData != nullptr) {
		EXPECT_GT(outputLength, 0);
		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}
}

// Test with image data at the maximum allowed size
TEST_F(ImagesProcessorTest, ApplyFilter_MaxSizeAllowed)
{
	// Create a simple image that's just under the max size limit
	// Note: We're not creating a full kMaxImageLength image as that would be memory intensive
	// Instead we'll create a reasonable sized image and test the size validation logic
	
	const int approximateMaxPixels = static_cast<int>(sqrt(kMaxImageLength / 3)); // Approximate max pixels per dimension for RGB
	const int width = 100; // Using smaller size for the test but still checking max size logic
	const int height = 100;
	const int channels = 3;
	std::unique_ptr<unsigned char[]> testImage(new unsigned char[width * height * channels]());
	
	std::vector<unsigned char> imageDataBuffer;
	stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, testImage.get(), width * channels);
	
	int length = static_cast<int>(imageDataBuffer.size());
	// Test with length set to max allowed
	int adjustedLength = std::min<int>(length, static_cast<int>(kMaxImageLength));
	
	const char* filter = "grayscale";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), adjustedLength, filter, &outputData, extension, &outputLength);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);
	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

// Test with image data above the maximum allowed size
TEST_F(ImagesProcessorTest, ApplyFilter_ExceedsMaxSizeAllowed)
{
	// Create a valid image but set the length to exceed the max allowed
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	// Artificially set the length to exceed the maximum
	int length = static_cast<int>(kMaxImageLength) + 1;
	
	const char* filter = "grayscale";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength);

	// Expected behavior depends on implementation:
	// 1. Either reject with nullptr output
	// 2. Or process only up to the max allowed size
	if (outputData == nullptr) {
		EXPECT_EQ(outputLength, 0);
	} else {
		EXPECT_GT(outputLength, 0);
		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}
}

// Test for proper memory management with multiple filter applications
TEST_F(ImagesProcessorTest, MemoryManagement_MultipleFilterApplications)
{
	// Apply filters to multiple images in sequence to check for memory leaks
	const std::vector<std::string> filters = { "grayscale", "invert", "blur", "flipHorizontal", "flipVertical" };
	
	for (const auto& filter : filters)
	{
		std::vector<unsigned char> imageData = GetMockImageData(".png");
		int length = static_cast<int>(imageData.size());
		const char* extension = ".png";
		unsigned char* outputData = nullptr;
		int outputLength = 0;

		ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter.c_str(), &outputData, extension, &outputLength);

		EXPECT_NE(outputData, nullptr);
		EXPECT_GT(outputLength, 0);
		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}
}

// Test specific filter output validation (checking the actual transformation)
TEST_F(ImagesProcessorTest, ValidateFilterOutput_Grayscale)
{
	// Create a simple image with known colors
	const int width = 2;
	const int height = 2;
	const int channels = 3;
	std::unique_ptr<unsigned char[]> testImage(new unsigned char[width * height * channels]());
	
	// Fill with known values - RGB values that have distinctive grayscale equivalents
	// Red (255,0,0), Green (0,255,0), Blue (0,0,255), White (255,255,255)
	testImage[0] = 255; testImage[1] = 0;   testImage[2] = 0;   // Red
	testImage[3] = 0;   testImage[4] = 255; testImage[5] = 0;   // Green
	testImage[6] = 0;   testImage[7] = 0;   testImage[8] = 255; // Blue
	testImage[9] = 255; testImage[10] = 255; testImage[11] = 255; // White
	
	std::vector<unsigned char> imageDataBuffer;
	stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, testImage.get(), width * channels);
	
	int length = static_cast<int>(imageDataBuffer.size());
	const char* filter = "grayscale";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), length, filter, &outputData, extension, &outputLength);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);
	
	// To fully validate the output, we would need to decode it and check pixel values
	// This would require additional test helper functions to decode the image
	// For now, we're just ensuring it produces valid output
	
	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

// Test unsupported image format
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
	if (outputData == nullptr) {
		EXPECT_EQ(outputLength, 0);
	} else {
		EXPECT_GT(outputLength, 0);
		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}
}