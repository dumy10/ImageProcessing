using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Upload;
using ImagesAPI.Settings;

namespace ImagesAPI.Services
{
    public class GoogleService : IGoogleService
    {
        private readonly DriveService _driveService;
        private readonly string _directoryId;
        public GoogleService(IGoogleAPISettings settings)
        {
            // Get the executing assembly path
            var baseDir = AppContext.BaseDirectory;
            // Go back to the project files
            var projectDir = Path.GetFullPath(Path.Combine(baseDir, @"..\..\.."));

            // Get the path to the key file
            var keyFilePath = Path.Combine(projectDir, "Credentials", settings.KeyFileName);

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

        public async Task<Google.Apis.Drive.v3.Data.File> GetFile(string imageId)
        {
            var request = _driveService.Files.Get(imageId);
            request.Fields = "*";

            return await request.ExecuteAsync();
        }

        public async Task<MemoryStream> GetStreamForImage(string imageId)
        {
            var request = _driveService.Files.Get(imageId);
            var memoryStream = new MemoryStream();
            await request.DownloadAsync(memoryStream);
            memoryStream.Position = 0;

            return memoryStream;
        }

        public string GetImageURL(string imageId, int width, int height)
        {
            return $"https://drive.google.com/thumbnail?id={imageId}&sz=w{width}-h{height}";
        }
    }
}