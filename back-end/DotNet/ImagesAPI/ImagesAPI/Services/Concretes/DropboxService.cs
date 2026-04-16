using Dropbox.Api;
using Dropbox.Api.Files;
using ImagesAPI.Services.Interfaces;
using ImagesAPI.Settings.Interfaces;

namespace ImagesAPI.Services.Concretes
{
    /// <summary>
    /// Service for interacting with Dropbox to perform image-related operations.
    /// </summary>
    /// <remarks>
    /// Constructor for the DropboxService
    /// </remarks>
    /// <param name="dropboxAPISettings">Dropbox API settings</param>
    /// <param name="cacheService">Cache service for optimizing image retrieval</param>
    public class DropboxService(IDropboxAPISettings dropboxAPISettings, ICacheService cacheService) : IDropboxService
    {
        private readonly DropboxClient _dropboxClient = new(dropboxAPISettings.RefreshToken, dropboxAPISettings.AppKey, dropboxAPISettings.AppSecret);
        private readonly ICacheService _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));

        #region Cache Durations
        private const int CACHE_DURATION_METADATA = 120; // 2 hours
        private const int CACHE_DURATION_URL = 1440; // 24 hours
        #endregion

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

            // Remove from cache if the deletion is successful
            if (result.Metadata != null)
            {
                _cacheService.Remove($"image_stream_{imageId}");
                _cacheService.Remove($"image_metadata_{imageId}");
                _cacheService.Remove($"image_url_{imageId}");
            }

            return result.Metadata != null;
        }

        /// <summary>
        /// Retrieves a file's metadata from Dropbox.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>The file metadata.</returns>
        public async Task<FileMetadata?> GetFile(string imageId)
        {
            // Try to get the metadata from cache first
            string cacheKey = $"image_metadata_{imageId}";

            return await _cacheService.GetOrCreateAsync<FileMetadata?>(cacheKey, async () => await _dropboxClient.Files.GetMetadataAsync(imageId) as FileMetadata, CACHE_DURATION_METADATA);
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
            // We do not want to cache the stream itself, it can be a large object and the CLR could dispose it making it unusable
            using var downloadedFile = await (await _dropboxClient.Files.DownloadAsync(imageId)).GetContentAsStreamAsync();
            var memoryStream = new MemoryStream();
            await downloadedFile.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            return memoryStream;
        }

        /// <summary>
        /// Retrieves the image data as a base64-encoded string from Dropbox.
        /// </summary>
        /// <param name="imageId">The ID of the image file</param>
        /// <returns>A string containing the base64 image.</returns>
        public async Task<string> GetBase64EncodedData(string imageId)
        {
            using var stream = await GetStreamForImage(imageId);
            if (stream is null)
            {
                return string.Empty;
            }

            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            byte[] imageBytes = memoryStream.ToArray();
            return Convert.ToBase64String(imageBytes);
        }

        /// <summary>
        /// Generates a public URL for the image stored on Dropbox.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>The public URL of the image.</returns>
        public async Task<string> GetImageURL(string imageId)
        {
            // Try to get the URL from cache first
            string cacheKey = $"image_url_{imageId}";

            return await _cacheService.GetOrCreateAsync<string>(cacheKey,
                async () =>
                {
                    try
                    {
                        var sharedLink = await _dropboxClient.Sharing.CreateSharedLinkWithSettingsAsync(imageId);
                        return sharedLink.Url.Replace("dl=0", "raw=1");
                    }
                    catch (Exception)
                    {
                        // Return empty string instead of null in case of failure
                        return string.Empty;
                    }
                },
                CACHE_DURATION_URL
            ) ?? string.Empty; // Use empty string as fallback if null is returned
        }
    }
}
