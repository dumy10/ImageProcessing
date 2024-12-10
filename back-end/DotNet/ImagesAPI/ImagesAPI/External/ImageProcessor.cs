using System.Runtime.InteropServices;

namespace ImagesAPI.External
{
    public static partial class ImageProcessor
    {
        public static void GetFilteredImageData(byte[] imageData, string filter, string extension, out byte[] outputImageData)
        {
            ApplyFilter(imageData, imageData.Length, filter, out IntPtr outputImageDataPtr, extension, out int outputLength);
            outputImageData = new byte[outputLength];
            Marshal.Copy(outputImageDataPtr, outputImageData, 0, outputLength);

            if (outputImageData.Length != outputLength)
            {
                FreeMemory(outputImageDataPtr);
                throw new InvalidOperationException("The output image data length does not match the expected length.");
            }

            if (outputImageDataPtr != IntPtr.Zero)
            {
                FreeMemory(outputImageDataPtr);
            }
        }

        [LibraryImport("ImagesProcessor.dll", StringMarshalling = StringMarshalling.Utf8)]
        [UnmanagedCallConv(CallConvs = [typeof(System.Runtime.CompilerServices.CallConvCdecl)])]
        private static partial void ApplyFilter([In] byte[] imageData, int length, string filter, out IntPtr outputImageData, string extension, out int outputLength);

        [LibraryImport("ImagesProcessor.dll", StringMarshalling = StringMarshalling.Utf8)]
        [UnmanagedCallConv(CallConvs = [typeof(System.Runtime.CompilerServices.CallConvCdecl)])]
        private static partial void FreeMemory(IntPtr data);
    }
}