namespace ImagesAPI.Services
{
    /// <summary>
    /// Interface defining methods for interacting with Google Drive for image-related operations.
    /// </summary>
    [Obsolete("This interface is not used anymore because the Google Drive Embeded images are not working correctly.")]
    public interface IGoogleService : IDriveService
    {
        /// <summary>
        /// Retrieves a file's metadata from Google Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>The file metadata.</returns>
        Task<Google.Apis.Drive.v3.Data.File> GetFile(string imageId);
    }
}
