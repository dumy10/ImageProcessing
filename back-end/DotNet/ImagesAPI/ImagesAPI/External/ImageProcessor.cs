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
        #region Public method

        /// <summary>
        /// Applies a specified filter to the input image data and outputs the filtered image data.
        /// </summary>
        /// <param name="imageData">The input image data as a byte array.</param>
        /// <param name="filter">The name of the filter to apply.</param>
        /// <param name="extension">The file extension of the image.</param>
        /// <param name="outputImageData">The output image data as a byte array.</param>
        /// <param name="progressCallback">Optional callback function for progress updates.</param>
        /// <exception cref="ArgumentNullException">Thrown when imageData, filter, or extension is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when an error occurs during image processing.</exception>
        public static void GetFilteredImageData(byte[] imageData, string filter, string extension, out byte[] outputImageData, ProgressCallback? progressCallback = null)
        {
            ValidateInputParameters(imageData, filter, extension);

            using var callbackManager = new CallbackManager(progressCallback);
            using var memoryManager = new UnmanagedMemoryManager();

            try
            {
                var result = ProcessImageWithFilter(imageData, filter, extension, callbackManager.NativeCallback, memoryManager);
                
                outputImageData = result;
                
                Logging.Instance.LogMessage("Successfully processed image with filter.");
            }
            catch (Exception ex)
            {
                Logging.Instance.LogError($"Error in image processing: {ex.Message}");
                throw new InvalidOperationException("An error occurred while filtering the image. Please try again.", ex);
            }
        }

        #endregion

        #region Private internal methods

        /// <summary>
        /// Validates the input parameters for image processing.
        /// </summary>
        /// <param name="imageData">The input image data.</param>
        /// <param name="filter">The filter name.</param>
        /// <param name="extension">The file extension.</param>
        /// <exception cref="ArgumentNullException">Thrown when any parameter is null or empty.</exception>
        private static void ValidateInputParameters(byte[] imageData, string filter, string extension)
        {
            if (imageData == null || imageData.Length == 0)
                throw new ArgumentNullException(nameof(imageData), "Image data cannot be null or empty.");
            
            if (string.IsNullOrWhiteSpace(filter))
                throw new ArgumentNullException(nameof(filter), "Filter name cannot be null or empty.");
            
            if (string.IsNullOrWhiteSpace(extension))
                throw new ArgumentNullException(nameof(extension), "File extension cannot be null or empty.");
        }

        /// <summary>
        /// Processes the image data by applying the specified filter.
        /// </summary>
        /// <param name="imageData">The input image data.</param>
        /// <param name="filter">The filter to apply.</param>
        /// <param name="extension">The file extension.</param>
        /// <param name="nativeCallback">The native progress callback.</param>
        /// <param name="memoryManager">The memory manager for handling unmanaged memory.</param>
        /// <returns>The processed image data.</returns>
        private static byte[] ProcessImageWithFilter(byte[] imageData, string filter, string extension, NativeProgressCallback? nativeCallback, UnmanagedMemoryManager memoryManager)
        {
            ApplyFilter(imageData, imageData.Length, filter, out IntPtr outputImageDataPtr, extension, out int outputLength, nativeCallback);

            if (outputImageDataPtr == IntPtr.Zero)
            {
                Logging.Instance.LogError("The output image data pointer is null.");
                throw new InvalidOperationException("Native filter processing returned null pointer.");
            }

            memoryManager.SetPointer(outputImageDataPtr);

            var outputImageData = new byte[outputLength];
            Marshal.Copy(outputImageDataPtr, outputImageData, 0, outputLength);

            if (outputImageData.Length != outputLength)
            {
                Logging.Instance.LogError($"Output image data length mismatch. Expected: {outputLength}, Actual: {outputImageData.Length}");
                throw new InvalidOperationException("Output image data length does not match expected length.");
            }

            return outputImageData;
        }

        #endregion

        #region Private classes

        /// <summary>
        /// Manages native progress callbacks and their associated GC handles.
        /// </summary>
        private sealed class CallbackManager : IDisposable
        {
            private readonly GCHandle? _callbackHandle;
            
            public NativeProgressCallback? NativeCallback { get; }

            public CallbackManager(ProgressCallback? progressCallback)
            {
                if (progressCallback != null)
                {
                    NativeCallback = new NativeProgressCallback(progressCallback.Invoke);
                    _callbackHandle = GCHandle.Alloc(NativeCallback);
                }
            }

            public void Dispose()
            {
                _callbackHandle?.Free();
            }
        }

        /// <summary>
        /// Manages unmanaged memory pointers and ensures proper cleanup.
        /// </summary>
        private sealed class UnmanagedMemoryManager : IDisposable
        {
            private IntPtr _pointer = IntPtr.Zero;

            public void SetPointer(IntPtr pointer)
            {
                _pointer = pointer;
            }

            public void Dispose()
            {
                if (_pointer != IntPtr.Zero)
                {
                    Logging.Instance.LogMessage("Deallocating unmanaged memory.");
                    FreeMemory(ref _pointer);
                }
            }
        }
        #endregion

        #region Native Methods
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
        #endregion
    }
}