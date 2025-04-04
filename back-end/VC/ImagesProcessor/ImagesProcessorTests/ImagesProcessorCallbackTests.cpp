#include "ImagesProcessorTest.h"

// Progress callback tests

TEST_F(ImagesProcessorTest, ApplyFilter_WithProgressCallback)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "grayscale";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength, ProgressCallbackTracker);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);

	// Verify progress callback was called
	EXPECT_FALSE(progressValues.empty());

	// First progress should be 0
	EXPECT_TRUE(std::find(progressValues.begin(), progressValues.end(), 0) != progressValues.end());

	// Last progress should be 100
	EXPECT_EQ(progressValues.back(), 100);

	// Check for intermediate progress values
	EXPECT_TRUE(std::find(progressValues.begin(), progressValues.end(), 5) != progressValues.end() ||
		std::find(progressValues.begin(), progressValues.end(), 10) != progressValues.end() ||
		std::find(progressValues.begin(), progressValues.end(), 40) != progressValues.end());

	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

TEST_F(ImagesProcessorTest, ApplyFilter_ProgressCallback_InvalidParameters)
{
	const char* imageData = nullptr;
	const char* filter = nullptr;
	const char* extension = nullptr;
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(imageData, 0, filter, &outputData, extension, &outputLength, ProgressCallbackTracker);

	EXPECT_EQ(outputData, nullptr);
	EXPECT_EQ(outputLength, 0);

	// Progress should still be called with 100% to indicate completion, even with error
	EXPECT_FALSE(progressValues.empty());
	EXPECT_EQ(progressValues.back(), 100);
}

TEST_F(ImagesProcessorTest, ApplyFilter_ProgressCallback_InvalidFilter)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "nonexistentFilter";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength, ProgressCallbackTracker);

	EXPECT_EQ(outputData, nullptr);
	EXPECT_EQ(outputLength, 0);

	// Progress should still be called with 100% to indicate completion, even with error
	EXPECT_FALSE(progressValues.empty());
	EXPECT_EQ(progressValues.back(), 100);
}

TEST_F(ImagesProcessorTest, ApplyFilter_ProgressCallback_InvalidExtension)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "grayscale";
	const char* extension = ".unsupported";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength, ProgressCallbackTracker);

	EXPECT_EQ(outputData, nullptr);
	EXPECT_EQ(outputLength, 0);

	// Progress should still be called with 100% to indicate completion, even with error
	EXPECT_FALSE(progressValues.empty());
	EXPECT_EQ(progressValues.back(), 100);
}

TEST_F(ImagesProcessorTest, ApplyFilter_ProgressCallback_MultipleFilters)
{
	// Test that different filters all properly report progress
	std::vector<std::string> filters = { "grayscale", "invert", "blur", "flipVertical", "flipHorizontal" };

	for (const auto& filter : filters) 
	{
		ResetProgressTracking();

		std::vector<unsigned char> imageData = GetMockImageData(".png");
		int length = static_cast<int>(imageData.size());
		const char* extension = ".png";
		unsigned char* outputData = nullptr;
		int outputLength = 0;

		ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter.c_str(), &outputData, extension, &outputLength, ProgressCallbackTracker);

		EXPECT_NE(outputData, nullptr);
		EXPECT_GT(outputLength, 0);

		// Verify progress callback was called and reached 100%
		EXPECT_FALSE(progressValues.empty());
		EXPECT_EQ(progressValues.back(), 100);

		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}
}

TEST_F(ImagesProcessorTest, ApplyFilter_ProgressCallback_StrictlyIncreasing)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "grayscale";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength, ProgressCallbackTracker);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);

	// Verify progress is non-decreasing
	int lastProgress = -1;
	for (int progress : progressValues) 
	{
		EXPECT_GE(progress, lastProgress) << "Progress should be monotonically non-decreasing";
		lastProgress = progress;
	}

	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

TEST_F(ImagesProcessorTest, ApplyFilter_NullProgressCallback)
{
	std::vector<unsigned char> imageData = GetMockImageData(".png");
	int length = static_cast<int>(imageData.size());
	const char* filter = "grayscale";
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	// Pass nullptr for the progress callback
	ApplyFilter(reinterpret_cast<const char*>(imageData.data()), length, filter, &outputData, extension, &outputLength, nullptr);

	// Processing should still succeed without a progress callback
	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);

	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}

TEST_F(ImagesProcessorTest, ApplyFilter_ProgressCallback_LargeImage)
{
	// Create a larger image to test more substantial progress updates
	const int width = 1000;
	const int height = 1000;
	const int channels = 3;
	std::unique_ptr<unsigned char[]> largeImage(new unsigned char[width * height * channels]());

	// Fill with data
	for (int y = 0; y < height; y++) 
	{
		for (int x = 0; x < width; x++) 
		{
			int index = (y * width + x) * channels;
			largeImage.get()[index] = static_cast<unsigned char>(x % 255);
			largeImage.get()[index + 1] = static_cast<unsigned char>(y % 255);
			largeImage.get()[index + 2] = 0;
		}
	}

	std::vector<unsigned char> imageDataBuffer;
	stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, largeImage.get(), width * channels);

	int length = static_cast<int>(imageDataBuffer.size());
	const char* filter = "blur"; // Use blur as it's typically more processor-intensive
	const char* extension = ".png";
	unsigned char* outputData = nullptr;
	int outputLength = 0;

	ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), length, filter, &outputData, extension, &outputLength, ProgressCallbackTracker);

	EXPECT_NE(outputData, nullptr);
	EXPECT_GT(outputLength, 0);

	// Verify progress callback was called with multiple different values
	EXPECT_FALSE(progressValues.empty());
	EXPECT_EQ(progressValues.back(), 100);

	// With a large image, expect more than just a few progress updates
	std::set<int> uniqueProgressValues(progressValues.begin(), progressValues.end());
	EXPECT_GT(uniqueProgressValues.size(), 3) << "Expected more progress updates for a large image";

	EXPECT_NO_THROW(FreeMemory(&outputData));
	EXPECT_EQ(outputData, nullptr);
}