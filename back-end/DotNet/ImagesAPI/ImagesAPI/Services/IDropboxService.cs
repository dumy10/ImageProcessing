namespace ImagesAPI.Services
{
    public interface IDropboxService : IDriveService
    {
        /// <summary>
        /// Retrieves a file's metadata from Dropbox.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>The file metadata.</returns>
        Task<Dropbox.Api.Files.FileMetadata?> GetFile(string imageId);
    }
}
