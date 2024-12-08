using System.Runtime.InteropServices;

namespace ImagesAPI.External
{
    public static partial class ImageProcessor
    {
        [LibraryImport("ImagesProcessor.dll", StringMarshalling = StringMarshalling.Utf8)]
        [UnmanagedCallConv(CallConvs = [typeof(System.Runtime.CompilerServices.CallConvCdecl)])]
        public static partial void ApplyFilter([In, Out] byte[] imageData, int length, string filter);
    }
}