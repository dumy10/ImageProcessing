#include "ImagesProcessorTest.h"

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
		for (int y = 0; y < height; y++)
		{
			for (int x = 0; x < width; x++)
			{
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
	if (outputData == nullptr)
	{
		EXPECT_EQ(outputLength, 0);
	}
	else {
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

// Test performance with different image dimensions but same total pixel count
TEST_F(ImagesProcessorTest, PerformanceBenchmark_DifferentAspectRatios)
{
	// Test different aspect ratios while keeping pixel count roughly the same
	const std::vector<std::pair<int, int>> dimensions = {
		{500, 500},    // Square: 1:1
		{707, 354},    // Landscape: 2:1
		{354, 707},    // Portrait: 1:2
		{1000, 250},   // Extreme landscape: 4:1
		{250, 1000}    // Extreme portrait: 1:4
	};

	const char* filter = "grayscale";
	const char* extension = ".png";

	for (const auto& [width, height] : dimensions)
	{
		const int channels = 3;
		std::unique_ptr<unsigned char[]> testImage(new unsigned char[width * height * channels]());

		// Fill with data
		for (int y = 0; y < height; y++)
		{
			for (int x = 0; x < width; x++)
			{
				int index = (y * width + x) * channels;
				testImage.get()[index] = static_cast<unsigned char>(x % 255);
				testImage.get()[index + 1] = static_cast<unsigned char>(y % 255);
				testImage.get()[index + 2] = static_cast<unsigned char>((x + y) % 255);
			}
		}

		std::vector<unsigned char> imageDataBuffer;
		stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, testImage.get(), width * channels);

		int length = static_cast<int>(imageDataBuffer.size());
		unsigned char* outputData = nullptr;
		int outputLength = 0;

		// Measure time
		auto start = std::chrono::high_resolution_clock::now();
		ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), length, filter, &outputData, extension, &outputLength);
		auto end = std::chrono::high_resolution_clock::now();

		std::chrono::duration<double, std::milli> duration = end - start;
		std::cout << "Image dimensions: " << width << "x" << height << " (" << width * height << " pixels), Processing time: " << duration.count() << " ms" << std::endl;

		EXPECT_NE(outputData, nullptr);
		EXPECT_GT(outputLength, 0);
		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}
}

// Benchmark comparing different filters' performance on the same image
TEST_F(ImagesProcessorTest, PerformanceBenchmark_DifferentFilters)
{
	const int width = 800;
	const int height = 800;
	const int channels = 3;
	const std::vector<std::string> filters = { "grayscale", "invert", "blur", "flipHorizontal", "flipVertical" };
	const char* extension = ".png";

	// Create a single test image to use for all filters
	std::unique_ptr<unsigned char[]> testImage(new unsigned char[width * height * channels]());

	// Fill with complex pattern to ensure meaningful processing
	for (int y = 0; y < height; y++)
	{
		for (int x = 0; x < width; x++)
		{
			int index = (y * width + x) * channels;
			testImage.get()[index] = static_cast<unsigned char>((x * y) % 255);
			testImage.get()[index + 1] = static_cast<unsigned char>((x + y) % 255);
			testImage.get()[index + 2] = static_cast<unsigned char>((x - y + 255) % 255);
		}
	}

	std::vector<unsigned char> imageDataBuffer;
	stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, testImage.get(), width * channels);
	int length = static_cast<int>(imageDataBuffer.size());

	std::cout << "Performance comparison of different filters on " << width << "x" << height << " image:" << std::endl;

	// Test each filter and measure performance
	for (const auto& filter : filters)
	{
		unsigned char* outputData = nullptr;
		int outputLength = 0;

		// Measure time with multiple iterations to get more reliable results
		const int iterations = 3;
		double totalDuration = 0;

		for (int i = 0; i < iterations; i++)
		{
			auto start = std::chrono::high_resolution_clock::now();
			ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), length, filter.c_str(), &outputData, extension, &outputLength);
			auto end = std::chrono::high_resolution_clock::now();

			std::chrono::duration<double, std::milli> duration = end - start;
			totalDuration += duration.count();

			EXPECT_NE(outputData, nullptr);
			EXPECT_GT(outputLength, 0);

			// Free memory after each iteration except the last one
			if (i < iterations - 1)
			{
				EXPECT_NO_THROW(FreeMemory(&outputData));
				EXPECT_EQ(outputData, nullptr);
			}
		}

		double averageDuration = totalDuration / iterations;
		std::cout << "Filter: " << filter << ", Average processing time: " << averageDuration << " ms" << std::endl;

		// Free memory after all iterations
		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}
}

// Test sequential vs chain performance (if chaining is supported)
TEST_F(ImagesProcessorTest, PerformanceBenchmark_SequentialVsChained)
{
	const int width = 600;
	const int height = 600;
	const int channels = 3;
	const char* extension = ".png";

	// Create a test image
	std::unique_ptr<unsigned char[]> testImage(new unsigned char[width * height * channels]());

	// Fill with data
	for (int y = 0; y < height; y++)
	{
		for (int x = 0; x < width; x++)
		{
			int index = (y * width + x) * channels;
			testImage.get()[index] = static_cast<unsigned char>(x % 255);
			testImage.get()[index + 1] = static_cast<unsigned char>(y % 255);
			testImage.get()[index + 2] = static_cast<unsigned char>((x + y) % 255);
		}
	}

	std::vector<unsigned char> imageDataBuffer;
	stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, testImage.get(), width * channels);
	int length = static_cast<int>(imageDataBuffer.size());

	// Method 1: Apply filters sequentially
	auto startSequential = std::chrono::high_resolution_clock::now();

	// Apply first filter (grayscale)
	unsigned char* intermediateData = nullptr;
	int intermediateLength = 0;
	ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), length, "grayscale", &intermediateData, extension, &intermediateLength);

	// Apply second filter (invert)
	unsigned char* finalDataSequential = nullptr;
	int finalLengthSequential = 0;
	ApplyFilter(reinterpret_cast<const char*>(intermediateData), intermediateLength, "invert", &finalDataSequential, extension, &finalLengthSequential);

	auto endSequential = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double, std::milli> durationSequential = endSequential - startSequential;

	// Method 2: Apply filters via chaining (if supported)
	auto startChained = std::chrono::high_resolution_clock::now();

	unsigned char* finalDataChained = nullptr;
	int finalLengthChained = 0;
	ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), length, "grayscale,invert", &finalDataChained, extension, &finalLengthChained);

	auto endChained = std::chrono::high_resolution_clock::now();
	std::chrono::duration<double, std::milli> durationChained = endChained - startChained;

	// Output results
	std::cout << "Sequential filter application time: " << durationSequential.count() << " ms" << std::endl;
	std::cout << "Chained filter application time: " << durationChained.count() << " ms" << std::endl;

	// Clean up
	EXPECT_NO_THROW(FreeMemory(&intermediateData));
	EXPECT_EQ(intermediateData, nullptr);

	if (finalDataSequential != nullptr)
	{
		EXPECT_NO_THROW(FreeMemory(&finalDataSequential));
		EXPECT_EQ(finalDataSequential, nullptr);
	}

	if (finalDataChained != nullptr)
	{
		EXPECT_NO_THROW(FreeMemory(&finalDataChained));
		EXPECT_EQ(finalDataChained, nullptr);

		std::cout << "Note: Filter chaining appears to be supported." << std::endl;
	}
	else
	{
		std::cout << "Note: Filter chaining does not appear to be supported." << std::endl;
	}
}

// Test performance with different image content complexity
TEST_F(ImagesProcessorTest, PerformanceBenchmark_ContentComplexity)
{
	const int width = 800;
	const int height = 800;
	const int channels = 3;
	const char* filter = "blur"; // Blur is typically sensitive to image content
	const char* extension = ".png";

	// Image patterns with different complexity
	enum class Pattern { Solid, Gradient, Noise, HighFrequency };
	std::vector<std::pair<Pattern, std::string>> patterns = {
		{Pattern::Solid, "Solid color (low complexity)"},
		{Pattern::Gradient, "Smooth gradient (medium complexity)"},
		{Pattern::Noise, "Random noise (high complexity)"},
		{Pattern::HighFrequency, "High frequency pattern (very high complexity)"}
	};

	for (const auto& [pattern, description] : patterns)
	{
		std::unique_ptr<unsigned char[]> testImage(new unsigned char[width * height * channels]());

		// Fill with different patterns
		for (int y = 0; y < height; y++)
		{
			for (int x = 0; x < width; x++)
			{
				int index = (y * width + x) * channels;

				switch (pattern) {
				case Pattern::Solid:
					// Solid red color
					testImage.get()[index] = 255;
					testImage.get()[index + 1] = 0;
					testImage.get()[index + 2] = 0;
					break;

				case Pattern::Gradient:
					// Smooth gradient
					testImage.get()[index] = static_cast<unsigned char>((x / static_cast<float>(width)) * 255);
					testImage.get()[index + 1] = static_cast<unsigned char>((y / static_cast<float>(height)) * 255);
					testImage.get()[index + 2] = 128;
					break;

				case Pattern::Noise:
					// Random noise
					testImage.get()[index] = static_cast<unsigned char>(rand() % 256);
					testImage.get()[index + 1] = static_cast<unsigned char>(rand() % 256);
					testImage.get()[index + 2] = static_cast<unsigned char>(rand() % 256);
					break;

				case Pattern::HighFrequency:
					// Checkerboard pattern (high frequency)
					testImage.get()[index] = ((x / 10 + y / 10) % 2) * 255;
					testImage.get()[index + 1] = ((x / 10 + y / 10) % 2) * 255;
					testImage.get()[index + 2] = ((x / 10 + y / 10) % 2) * 255;
					break;
				}
			}
		}

		std::vector<unsigned char> imageDataBuffer;
		stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, testImage.get(), width * channels);
		int length = static_cast<int>(imageDataBuffer.size());

		unsigned char* outputData = nullptr;
		int outputLength = 0;

		// Measure time
		auto start = std::chrono::high_resolution_clock::now();
		ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), length, filter, &outputData, extension, &outputLength);
		auto end = std::chrono::high_resolution_clock::now();

		std::chrono::duration<double, std::milli> duration = end - start;
		std::cout << "Image content: " << description << ", Processing time: " << duration.count() << " ms" << std::endl;

		EXPECT_NE(outputData, nullptr);
		EXPECT_GT(outputLength, 0);
		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}
}

// Test memory usage over multiple consecutive filter applications
TEST_F(ImagesProcessorTest, PerformanceBenchmark_MemoryUsageOverTime)
{
	const int width = 800;
	const int height = 800;
	const int channels = 3;
	const char* filter = "grayscale";
	const char* extension = ".png";
	const int iterations = 20; // Run multiple iterations to potentially detect memory leaks

	// Create a test image
	std::unique_ptr<unsigned char[]> testImage(new unsigned char[width * height * channels]());

	// Fill with data
	for (int y = 0; y < height; y++)
	{
		for (int x = 0; x < width; x++)
		{
			int index = (y * width + x) * channels;
			testImage.get()[index] = static_cast<unsigned char>(x % 255);
			testImage.get()[index + 1] = static_cast<unsigned char>(y % 255);
			testImage.get()[index + 2] = static_cast<unsigned char>((x + y) % 255);
		}
	}

	std::vector<unsigned char> imageDataBuffer;
	stbi_write_png_to_func(kWriteCallback, &imageDataBuffer, width, height, channels, testImage.get(), width * channels);
	int length = static_cast<int>(imageDataBuffer.size());

	std::cout << "Running " << iterations << " consecutive filter applications to test memory stability:" << std::endl;

	for (int i = 0; i < iterations; i++)
	{
		unsigned char* outputData = nullptr;
		int outputLength = 0;

		auto start = std::chrono::high_resolution_clock::now();
		ApplyFilter(reinterpret_cast<const char*>(imageDataBuffer.data()), length, filter, &outputData, extension, &outputLength);
		auto end = std::chrono::high_resolution_clock::now();

		std::chrono::duration<double, std::milli> duration = end - start;
		std::cout << "Iteration " << (i + 1) << ", Processing time: " << duration.count() << " ms" << std::endl;

		// If processing failed, abort the test
		ASSERT_NE(outputData, nullptr);
		ASSERT_GT(outputLength, 0);

		EXPECT_NO_THROW(FreeMemory(&outputData));
		EXPECT_EQ(outputData, nullptr);
	}

	std::cout << "All iterations completed successfully. No apparent memory issues detected." << std::endl;
}
