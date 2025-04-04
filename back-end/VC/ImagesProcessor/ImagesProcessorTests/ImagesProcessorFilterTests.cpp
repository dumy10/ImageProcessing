#include "ImagesProcessorTest.h"

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
	if (outputData != nullptr) 
	{
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

	// Decode the output image to check pixel values
	int decodedWidth, decodedHeight, decodedChannels;
	unsigned char* decodedImage = stbi_load_from_memory(outputData, outputLength, &decodedWidth, &decodedHeight, &decodedChannels, channels);

	// Verify the image was decoded correctly
	ASSERT_NE(decodedImage, nullptr);
	EXPECT_EQ(decodedWidth, width);
	EXPECT_EQ(decodedHeight, height);

	// Expected grayscale values using standard RGB->Gray formula: Y = 0.299*R + 0.587*G + 0.114*B
	// Round to nearest integer for each test case
	const int expectedRedGray = static_cast<int>(0.299 * 255 + 0.587 * 0 + 0.114 * 0);
	const int expectedGreenGray = static_cast<int>(0.299 * 0 + 0.587 * 255 + 0.114 * 0);
	const int expectedBlueGray = static_cast<int>(0.299 * 0 + 0.587 * 0 + 0.114 * 255);
	const int expectedWhiteGray = 255; // White is always 255 in grayscale

	const int tolerance = 2; // Allow small variance due to compression/rounding

	// Check all RGB values for each pixel to ensure they are grayscale (R=G=B)
	// Red pixel (top-left)
	EXPECT_NEAR(decodedImage[0], expectedRedGray, tolerance);
	EXPECT_NEAR(decodedImage[1], decodedImage[0], tolerance);
	EXPECT_NEAR(decodedImage[2], decodedImage[0], tolerance);

	// Green pixel (top-right)
	EXPECT_NEAR(decodedImage[3], expectedGreenGray, tolerance);
	EXPECT_NEAR(decodedImage[4], decodedImage[3], tolerance);
	EXPECT_NEAR(decodedImage[5], decodedImage[3], tolerance);

	// Blue pixel (bottom-left)
	EXPECT_NEAR(decodedImage[6], expectedBlueGray, tolerance);
	EXPECT_NEAR(decodedImage[7], decodedImage[6], tolerance);
	EXPECT_NEAR(decodedImage[8], decodedImage[6], tolerance);

	// White pixel (bottom-right)
	EXPECT_NEAR(decodedImage[9], expectedWhiteGray, tolerance);
	EXPECT_NEAR(decodedImage[10], decodedImage[9], tolerance);
	EXPECT_NEAR(decodedImage[11], decodedImage[9], tolerance);

	// Clean up decoded image data
	stbi_image_free(decodedImage);

	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}