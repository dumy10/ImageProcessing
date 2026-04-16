namespace ImagesAPI.Services.Interfaces
{
    /// <summary>
    /// Interface defining methods for interacting with a cloud storage service for image-related operations.
    /// </summary>
    public interface IDriveService
    {
        /// <summary>
        /// Uploads an image to the Drive.
        /// </summary>
        /// <param name="image">The image file to upload.</param>
        /// <returns>The ID of the uploaded image file.</returns>
        Task<string> UploadImage(IFormFile image);

        /// <summary>
        /// Uploads an image to the Drive from a memory stream.
        /// </summary>
        /// <param name="stream">The memory stream containing the image data.</param>
        /// <param name="fileName">The name of the image file.</param>
        /// <param name="contentType">The content type of the image.</param>
        /// <returns>The ID of the uploaded image file.</returns>
        Task<string> UploadImage(MemoryStream stream, string fileName, string contentType);

        /// <summary>
        /// Deletes an image from the Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image to delete.</param>
        /// <returns>The result of the delete operation.</returns>
        Task<bool> DeleteImage(string imageId);

        /// <summary>
        /// Retrieves the image data as a memory stream from the Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>A memory stream containing the image data.</returns>
        Task<MemoryStream?> GetStreamForImage(string imageId);

        /// <summary>
        /// Retrieves the image data as a base64-encoded string from the Drive.
        /// </summary>
        /// <param name="imageId"></param>
        /// <returns></returns>
        Task<string> GetBase64EncodedData(string imageId);

        /// <summary>
        /// Generates a public URL for the image stored on the Drive.
        /// </summary>
        /// <param name="imageId">The ID of the image file.</param>
        /// <returns>The public URL of the image.</returns>
        Task<string> GetImageURL(string imageId);
    }
}
