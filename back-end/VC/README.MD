# ImagesProcessor Library

A high-performance C++ image processing library that provides a variety of image filters and transformations optimized for speed and quality.

## Overview

ImagesProcessor is a native C++ library that implements various image filters and transformations using advanced techniques like parallel processing. The library is designed to be integrated with other applications through its C-style API.

## Features

- **High Performance**: Utilizes OpenMP for parallel processing and optimized algorithms
- **Multiple Filter Types**: 
  - Basic: Grayscale, Invert, Blur
  - Edge Detection: Sobel, Canny
  - Artistic: Sepia, Oil Paint, Kaleidoscope, Mosaic, Glitch
  - Geometric: Flip Horizontal, Flip Vertical
- **Progress Reporting**: Support for callback functions to report filter application progress
- **Memory Management**: Proper handling of image data memory including allocation and cleanup
- **Error Handling**: Comprehensive error reporting and validation
- **Format Support**: Compatible with PNG, JPG, and JPEG image formats

## Prerequisites

- Visual Studio 2022
- CMake 3.22.0 or higher
- Windows 10/11 x64 platform

## How to build the project

### Building with CMake (Recommended)

1. Make sure that you are in the solution directory (`ImagesProcessor`).
2. Run the following commands:

```sh
mkdir build
cd build
cmake -G "Visual Studio 17 2022" -A x64 ..
cmake --build . --config Release
```

### Building with Visual Studio

1. Open Visual Studio 2022.
2. Go to `File` -> `Open` -> `Project/Solution`.
3. Navigate to the solution directory and open the `ImagesProcessor.sln` file.
4. Select the desired configuration (e.g., Debug, Release) and platform (e.g., x64).
5. Build the solution by clicking on `Build` -> `Build Solution`.

## Integration

To integrate the library into your project:

1. Include the `ImagesProcessor.h` header in your code
2. Link against the produced `ImagesProcessor.lib` file
3. Ensure the `ImagesProcessor.dll` is accessible at runtime

## API Reference

### Main Functions

- **ApplyFilter**: Applies a filter to an image
  ```cpp
  void ApplyFilter(
      const char* imageData,     // Input image data buffer
      int length,                // Length of the image data
      const char* filter,        // Filter name to apply
      unsigned char** outputData, // Output buffer for the processed image
      const char* extension,     // Image format extension (.png, .jpg, etc.)
      int* outputLength,         // Length of the output data
      ProgressCallback progressCallback = nullptr // Optional progress callback
  );
  ```

- **FreeMemory**: Frees memory allocated by the library
  ```cpp
  void FreeMemory(unsigned char** data);
  ```

### Supported Filters

- `grayscale` - Converts image to grayscale
- `invert` - Inverts all colors in the image
- `blur` - Applies a Gaussian blur effect
- `sobel` - Applies Sobel edge detection
- `canny` - Applies Canny edge detection
- `fliphorizontal` - Flips the image horizontally
- `flipvertical` - Flips the image vertically
- `sepia` - Applies a sepia tone effect
- `oilpaint` - Creates an oil painting effect
- `kaleidoscope` - Creates a kaleidoscope pattern
- `mosaic` - Creates a pixelated mosaic effect
- `glitch` - Applies digital glitch artifacts

## Performance Considerations

The library is optimized for performance through:
- Parallel processing using OpenMP
- Efficient memory management
- Algorithm optimizations for each filter type
- Progress callbacks to enable responsive UI during processing

## Testing

The library includes comprehensive test suites:
- Basic functionality tests
- Filter-specific tests
- Performance benchmarks
- Memory management tests
- Error handling tests

To run tests, build the `ImagesProcessorTests` project and execute the resulting binary.

## Dependencies

- [stb_image](https://github.com/nothings/stb) - Used for image loading and saving

## License

Copyright © 2025