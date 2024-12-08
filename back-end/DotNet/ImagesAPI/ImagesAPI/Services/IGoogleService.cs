namespace ImagesAPI.Services
{
    public interface IGoogleService
    {
        Task<string> UploadImage(IFormFile image);
        Task<string> UploadImage(MemoryStream stream, string fileName, string contentType);
        Task<Google.Apis.Drive.v3.Data.File> GetFile(string imageId);
        Task<MemoryStream> GetStreamForImage(string imageId);
        string GetImageURL(string imageId, int width, int height);
    }
}
