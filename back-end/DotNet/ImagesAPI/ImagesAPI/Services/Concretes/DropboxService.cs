using Dropbox.Api;
using Dropbox.Api.Files;
using ImagesAPI.Services.Interfaces;
using ImagesAPI.Settings.Interfaces;

namespace ImagesAPI.Services.Concretes
{
    /// <summary>
    /// Service for interacting with Dropbox to perform image-related operations.
    /// </summary>
    public class DropboxService(IDropboxAPISettings dropboxAPISettings) : IDropboxService
    {
        private readonly DropboxClient _dropboxClient = new(dropboxAPISettings.RefreshToken, dropboxAPISettings.AppKey, dropboxAPISettings.AppSecret);

        /// <summary>
        /// Uploads an image to Dropbox.
        /// </summary>
        /// <param name="image">The image file to upload.</param>
        /// <returns>The ID of the uploaded image file.</returns>
        public async Task<string> UploadImage(IFormFile image)
        {
            using var stream = new MemoryStream();
            await image.CopyToAsync(stream);
            stream.Position = 0;

            string uniqueFileName = Path.GetFileNameWithoutExtension(image.FileName) + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + Path.GetExtension(image.FileName);

            var response = await _dropboxClient.Files.UploadAsync($"/{uniqueFileName}", WriteMode.Add.Instance, body: stream);

            return response.Id;
        }

        /// <summary>
        /// Uploads an image to Dropbox from a memory stream.
        /// </summary>
        /// <param name="stream">The memory stream containing the image data.</param>
        /// <param name="fileName">The name of the image file.</param>
        /// <param name="contentType">The content type of the image.</param>
        /// <returns>The ID of the uploaded image file.</returns>
        public async Task<string> UploadImage(MemoryStream stream, string fileName, string contentType)
        {
            stream.Position = 0;

            string uniqueFileName = Path.GetFileNameWithoutExtension(fileName) + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + Path.GetExtension(fileName);

            var response = await _dropboxClient.Files.UploadAsync($"/{uniqueFileName}", WriteMode.Add.Instance, body: stream);

            return response.Id;
        }

        /// <summary>
        /// Deletes an image from Dropbox.
        /// </summary>
        /// <param name="imageId">The ID of the image to delete.</param>
        /// <returns>The result of the delete operation.</returns>
        public async Task<bool> DeleteImage(string imageId)
        {
            DeleteResult result = await _dropboxClient.Files.DeleteV2Async(imageId);

            return result.Metadata != null;
        }

        /// <summary>
        /// Retrieves a file's metadata from Dropbox.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>The file metadata.</returns>
        public async Task<FileMetadata?> GetFile(string imageId)
        {
            return await _dropboxClient.Files.GetMetadataAsync(imageId) as FileMetadata;
        }

        /// <summary>
        /// Retrieves the image data as a memory stream from Dropbox. 
        /// The stream's position is set to the beginning. 
        /// The caller is responsible for disposing the stream.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>A memory stream containing the image data.</returns>
        public async Task<MemoryStream?> GetStreamForImage(string imageId)
        {
            using var downloadedFile = await (await _dropboxClient.Files.DownloadAsync(imageId)).GetContentAsStreamAsync();
            var memoryStream = new MemoryStream();
            await downloadedFile.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            return memoryStream;
        }

        /// <summary>
        /// Generates a public URL for the image stored on Dropbox.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>The public URL of the image.</returns>
        public async Task<string> GetImageURL(string imageId)
        {
            var sharedLink = await _dropboxClient.Sharing.CreateSharedLinkWithSettingsAsync(imageId);

            return sharedLink.Url.Replace("dl=0", "raw=1");
        }
    }
}
