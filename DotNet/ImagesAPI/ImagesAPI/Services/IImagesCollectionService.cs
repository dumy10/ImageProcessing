using ImagesAPI.Models;

namespace ImagesAPI.Services
{
    /// <summary>
    /// Provides image-specific collection services, including applying filters to images.
    /// </summary>
    public interface IImagesCollectionService : ICollectionService<ImageModel>
    {
        /// <summary>
        /// Applies a specified filter to an image and returns the modified image model.
        /// </summary>
        /// <param name="id">The identifier of the image to modify.</param>
        /// <param name="filter">The name of the filter to apply.</param>
        /// <param name="driveService">The drive service for image operations.</param>
        /// <returns>A task representing the asynchronous operation, containing the modified image model.</returns>
        Task<ImageModel> ApplyFilterToImage(string id, string filter, IDriveService driveService);
    }
}
