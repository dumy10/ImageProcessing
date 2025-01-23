using ImagesAPI.Logger;
using System.Runtime.InteropServices;

namespace ImagesAPI.External
{
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
        /// <exception cref="InvalidOperationException">Thrown when the output image data length does not match the expected length.</exception>"
        public static void GetFilteredImageData(byte[] imageData, string filter, string extension, out byte[] outputImageData)
        {
            ApplyFilter(imageData, imageData.Length, filter, out IntPtr outputImageDataPtr, extension, out int outputLength);
            outputImageData = new byte[outputLength];
            Marshal.Copy(outputImageDataPtr, outputImageData, 0, outputLength);

            if (outputImageData.Length != outputLength)
            {
                FreeMemory(outputImageDataPtr);
                Logging.Instance.LogError("The output image data length does not match the expected length.");
                throw new InvalidOperationException("The output image data length does not match the expected length.");
            }

            if (outputImageDataPtr != IntPtr.Zero)
            {
                FreeMemory(outputImageDataPtr);
            }
        }

        /// <summary>
        /// Calls the unmanaged method to apply a filter to the image data.
        /// </summary>
        /// <param name="imageData">The input image data.</param>
        /// <param name="length">The length of the input image data.</param>
        /// <param name="filter">The filter to apply.</param>
        /// <param name="outputImageData">A pointer to the output image data.</param>
        /// <param name="extension">The image file extension.</param>
        /// <param name="outputLength">The length of the output image data.</param>
        [LibraryImport("ImagesProcessor.dll", StringMarshalling = StringMarshalling.Utf8)]
        [UnmanagedCallConv(CallConvs = [typeof(System.Runtime.CompilerServices.CallConvCdecl)])]
        private static partial void ApplyFilter([In] byte[] imageData, int length, string filter, out IntPtr outputImageData, string extension, out int outputLength);

        /// <summary>
        /// Frees memory allocated by the unmanaged code.
        /// </summary>
        /// <param name="data">A pointer to the memory to free.</param>
        [LibraryImport("ImagesProcessor.dll", StringMarshalling = StringMarshalling.Utf8)]
        [UnmanagedCallConv(CallConvs = [typeof(System.Runtime.CompilerServices.CallConvCdecl)])]
        private static partial void FreeMemory(IntPtr data);
    }
}