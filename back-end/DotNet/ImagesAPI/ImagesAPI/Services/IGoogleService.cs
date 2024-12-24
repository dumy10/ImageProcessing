namespace ImagesAPI.Services
{
    /// <summary>
    /// Interface defining methods for interacting with Google Drive for image-related operations.
    /// </summary>
    public interface IGoogleService
    {
        /// <summary>
        /// Uploads an image to Google Drive.
        /// </summary>
        /// <param name="image">The image file to upload.</param>
        /// <returns>The ID of the uploaded image file.</returns>
        Task<string> UploadImage(IFormFile image);

        /// <summary>
        /// Uploads an image to Google Drive from a memory stream.
        /// </summary>
        /// <param name="stream">The memory stream containing the image data.</param>
        /// <param name="fileName">The name of the image file.</param>
        /// <param name="contentType">The content type of the image.</param>
        /// <returns>The ID of the uploaded image file.</returns>
        Task<string> UploadImage(MemoryStream stream, string fileName, string contentType);

        /// <summary>
        /// Deletes an image from Google Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image to delete.</param>
        /// <returns>The result of the delete operation.</returns>
        Task<string> DeleteImage(string imageId);

        /// <summary>
        /// Retrieves a file's metadata from Google Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>The file metadata.</returns>
        Task<Google.Apis.Drive.v3.Data.File> GetFile(string imageId);

        /// <summary>
        /// Retrieves the image data as a memory stream from Google Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>A memory stream containing the image data.</returns>
        Task<MemoryStream> GetStreamForImage(string imageId);

        /// <summary>
        /// Generates a public URL for the image stored on Google Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <param name="width">The desired width of the image.</param>
        /// <param name="height">The desired height of the image.</param>
        /// <returns>The public URL of the image.</returns>
        string GetImageURL(string imageId, int width, int height);
    }
}
