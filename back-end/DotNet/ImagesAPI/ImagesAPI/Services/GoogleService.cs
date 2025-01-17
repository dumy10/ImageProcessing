using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Upload;
using ImagesAPI.Settings;

namespace ImagesAPI.Services
{
    /// <summary>
    /// Service for interacting with Google Drive to perform image-related operations.
    /// </summary>
    [Obsolete("This class is not used anymore because the Google Drive Embeded images are not working correctly.")]
    public class GoogleService : IGoogleService
    {
        private readonly DriveService _driveService;
        private readonly string _directoryId;

        /// <summary>
        /// Initializes a new instance of the <see cref="GoogleService"/> class.
        /// </summary>
        /// <param name="settings">The Google API settings.</param>
        public GoogleService(IGoogleAPISettings settings)
        {
            // Get the executing assembly path
            var baseDir = AppContext.BaseDirectory;
            // Go back to the project files
            var projectDir = Path.GetFullPath(Path.Combine(baseDir, @"..\..\.."));

            // Get the path to the key file
            var keyFilePath = Path.Combine(projectDir, "Credentials", settings.KeyFileName);

            // Check if the key file exists
            if (!File.Exists(keyFilePath))
            {
                throw new FileNotFoundException("The key file was not found.", keyFilePath);
            }

            // Create the credential object using the key file
            var credentials = GoogleCredential.FromFile(keyFilePath)
                .CreateScoped(DriveService.Scope.Drive); // It will have full access to the drive

            // Create the Drive service
            _driveService = new DriveService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credentials,
                ApplicationName = "ImagesAPI"
            });

            _directoryId = settings.DirectoryId;
        }

        /// <summary>
        /// Uploads an image to Google Drive.
        /// </summary>
        /// <param name="image">The image file to upload.</param>
        /// <returns>The ID of the uploaded image file.</returns>
        public async Task<string> UploadImage(IFormFile image)
        {
            var fileMetadata = new Google.Apis.Drive.v3.Data.File()
            {
                Name = image.FileName,
                Parents = [_directoryId]
            };

            await using var stream = new MemoryStream();
            await image.CopyToAsync(stream);
            stream.Position = 0;

            var request = _driveService.Files.Create(fileMetadata, stream, image.ContentType);
            request.Fields = "id";

            var result = await request.UploadAsync(CancellationToken.None);

            if (result.Status == UploadStatus.Failed)
            {
                return "";
            }

            return request.ResponseBody.Id;
        }

        /// <summary>
        /// Uploads an image to Google Drive from a memory stream.
        /// </summary>
        /// <param name="stream">The memory stream containing the image data.</param>
        /// <param name="fileName">The name of the image file.</param>
        /// <param name="contentType">The content type of the image.</param>
        /// <returns>The ID of the uploaded image file.</returns>
        public async Task<string> UploadImage(MemoryStream stream, string fileName, string contentType)
        {
            var fileMetadata = new Google.Apis.Drive.v3.Data.File()
            {
                Name = fileName,
                Parents = [_directoryId]
            };
            stream.Position = 0;

            var request = _driveService.Files.Create(fileMetadata, stream, contentType);
            request.Fields = "id";

            var result = await request.UploadAsync(CancellationToken.None);

            if (result.Status == UploadStatus.Failed)
            {
                return "";
            }

            return request.ResponseBody.Id;
        }

        /// <summary>
        /// Deletes an image from Google Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image to delete.</param>
        /// <returns>The result of the delete operation.</returns>
        public async Task<bool> DeleteImage(string imageId)
        {
            var result = await _driveService.Files.Delete(imageId).ExecuteAsync();
            return result != null;
        }

        /// <summary>
        /// Retrieves a file's metadata from Google Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>The file metadata.</returns>
        public async Task<Google.Apis.Drive.v3.Data.File> GetFile(string imageId)
        {
            var request = _driveService.Files.Get(imageId);
            request.Fields = "*";

            return await request.ExecuteAsync();
        }

        /// <summary>
        /// Retrieves the image data as a memory stream from Google Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>A memory stream containing the image data.</returns>
        public async Task<MemoryStream> GetStreamForImage(string imageId)
        {
            var request = _driveService.Files.Get(imageId);
            var memoryStream = new MemoryStream();
            await request.DownloadAsync(memoryStream);
            memoryStream.Position = 0;

            return memoryStream;
        }

        /// <summary>
        /// Generates a public URL for the image stored on Google Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>The public URL of the image.</returns>
        public async Task<string> GetImageURL(string imageId)
        {
            return await Task.FromResult($"https://lh3.googleusercontent.com/d/{imageId}?authuser=0");
        }
    }
}