using ImagesAPI.Logger;
using System.Runtime.InteropServices;

namespace ImagesAPI.External
{
    /// <summary>
    /// Callback delegate for reporting filter application progress
    /// </summary>
    /// <param name="progress">Progress value between 0-100</param>
    public delegate void ProgressCallback(int progress);

    /// <summary>
    /// Provides methods to process images by applying filters using unmanaged code.
    /// </summary>
    public static partial class ImageProcessor
    {
        /// <summary>
        /// Applies a specified filter to the input image data and outputs the filtered image data.
        /// </summary>
        /// <param name="imageData">The input image data as a byte array.</param>
        /// <param name="filter">The name of the filter to apply.</param>
        /// <param name="extension">The file extension of the image.</param>
        /// <param name="outputImageData">The output image data as a byte array.</param>
        /// <param name="progressCallback">Optional callback function for progress updates.</param>
        /// <exception cref="InvalidOperationException">Thrown when the output image data length does not match the expected length.</exception>
        public static void GetFilteredImageData(byte[] imageData, string filter, string extension, out byte[] outputImageData, ProgressCallback? progressCallback = null)
        {
            IntPtr outputImageDataPtr = IntPtr.Zero;

            try
            {
                // Create a native callback for progress updates if provided
                NativeProgressCallback? nativeCallback = null;
                GCHandle? callbackHandle = null;

                if (progressCallback != null)
                {
                    nativeCallback = new NativeProgressCallback(progress =>
                    {
                        progressCallback.Invoke(progress);
                    });

                    // Keep the delegate alive during the call
                    callbackHandle = GCHandle.Alloc(nativeCallback);
                }

                // Call the native function with the appropriate progress callback
                ApplyFilter(imageData, imageData.Length, filter, out outputImageDataPtr, extension, out int outputLength, nativeCallback);

                if (outputImageDataPtr == IntPtr.Zero)
                {
                    Logging.Instance.LogError("The output image data pointer is null.");
                    throw new InvalidOperationException("An error has occurred while filtering the image. Please try again.");
                }

                outputImageData = new byte[outputLength];

                Marshal.Copy(outputImageDataPtr, outputImageData, 0, outputLength);

                if (outputImageData.Length != outputLength)
                {
                    FreeMemory(ref outputImageDataPtr);
                    Logging.Instance.LogError("The output image data length does not match the expected length.");
                    throw new InvalidOperationException("An error has occurred while filtering the image. Please try again.");
                }

                if (outputImageDataPtr != IntPtr.Zero)
                {
                    Logging.Instance.LogMessage("Deallocating memory for the output image data.");
                    FreeMemory(ref outputImageDataPtr);
                }

                // Ensure completion is reported if progress callback is provided
                progressCallback?.Invoke(100);

                // Free the GCHandle if we created one
                callbackHandle?.Free();

                Logging.Instance.LogMessage("Successfully deallocated image data.");
            }
            catch (Exception ex)
            {
                // Clean up memory if allocation succeeded but something else failed
                if (outputImageDataPtr != IntPtr.Zero)
                {
                    FreeMemory(ref outputImageDataPtr);
                }

                Logging.Instance.LogError($"Error in native code execution: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Native callback delegate for progress updates from C++
        /// </summary>
        /// <param name="progress">Progress value between 0-100</param>
        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void NativeProgressCallback(int progress);

        /// <summary>
        /// Calls the unmanaged method to apply a filter to the image data with optional progress tracking.
        /// </summary>
        /// <param name="imageData">The input image data.</param>
        /// <param name="length">The length of the input image data.</param>
        /// <param name="filter">The filter to apply.</param>
        /// <param name="outputImageData">A pointer to the output image data.</param>
        /// <param name="extension">The image file extension.</param>
        /// <param name="outputLength">The length of the output image data.</param>
        /// <param name="progressCallback">Optional callback function for progress updates.</param>
        [LibraryImport(Platform.LibraryName, StringMarshalling = StringMarshalling.Utf8)]
        [UnmanagedCallConv(CallConvs = [typeof(System.Runtime.CompilerServices.CallConvCdecl)])]
        private static partial void ApplyFilter([In] byte[] imageData, int length, string filter, out IntPtr outputImageData, string extension, out int outputLength,
            [MarshalAs(UnmanagedType.FunctionPtr)] NativeProgressCallback? progressCallback);

        /// <summary>
        /// Frees memory allocated by the unmanaged code.
        /// </summary>
        /// <param name="data">A pointer to the memory to free.</param>
        [LibraryImport(Platform.LibraryName, StringMarshalling = StringMarshalling.Utf8)]
        [UnmanagedCallConv(CallConvs = [typeof(System.Runtime.CompilerServices.CallConvCdecl)])]
        private static partial void FreeMemory(ref IntPtr data);

        /// <summary>
        /// Dummy test function to check if the library is loaded correctly.
        /// </summary>
        /// <returns></returns>
        [LibraryImport(Platform.LibraryName, StringMarshalling = StringMarshalling.Utf8)]
        [UnmanagedCallConv(CallConvs = [typeof(System.Runtime.CompilerServices.CallConvCdecl)])]
        [return: MarshalAs(unmanagedType: UnmanagedType.Bool)]
        public static partial bool ProcessDummyTest();

        /// <summary>
        /// Platform-specific constants for library loading
        /// </summary>
        private static class Platform
        {
            /// <summary>
            /// The name of the library to load based on the platform
            /// </summary>
            public const string LibraryName =
                #if WINDOWS
                    "ImagesProcessor.dll";
                #else
                    "libImagesProcessor.so";
                #endif
        }
    }
}