using Dropbox.Api;
using Dropbox.Api.Files;
using ImagesAPI.Settings;

namespace ImagesAPI.Services
{
    public class DropboxService(IDropboxAPISettings dropboxAPISettings) : IDropboxService
    {
        private readonly DropboxClient _dropboxClient = new(dropboxAPISettings.AccessToken);

        public async Task<string> UploadImage(IFormFile image)
        {
            using var stream = new MemoryStream();
            await image.CopyToAsync(stream);
            stream.Position = 0;

            string uniqueFileName = Path.GetFileNameWithoutExtension(image.FileName) + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + Path.GetExtension(image.FileName);

            var response = await _dropboxClient.Files.UploadAsync($"/{uniqueFileName}", WriteMode.Add.Instance, body: stream);

            return response.Id;
        }
        public async Task<string> UploadImage(MemoryStream stream, string fileName, string contentType)
        {
            stream.Position = 0;

            string uniqueFileName = Path.GetFileNameWithoutExtension(fileName) + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + Path.GetExtension(fileName);

            var response = await _dropboxClient.Files.UploadAsync($"/{uniqueFileName}", WriteMode.Add.Instance, body: stream);

            return response.Id;
        }
        public async Task<bool> DeleteImage(string imageId)
        {
            DeleteResult result = await _dropboxClient.Files.DeleteV2Async(imageId);

            return result.Metadata != null;
        }
        public async Task<FileMetadata?> GetFile(string imageId)
        {
            return await _dropboxClient.Files.GetMetadataAsync(imageId) as FileMetadata;
        }
        public async Task<MemoryStream> GetStreamForImage(string imageId)
        {
            using var downloadedFile = await (await _dropboxClient.Files.DownloadAsync(imageId)).GetContentAsStreamAsync();
            var memoryStream = new MemoryStream();
            await downloadedFile.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            return memoryStream;
        }

        public async Task<string> GetImageURL(string imageId)
        {
            var sharedLink = await _dropboxClient.Sharing.CreateSharedLinkWithSettingsAsync(imageId);
            
            return sharedLink.Url.Replace("dl=0", "raw=1");
        }
    }
}
