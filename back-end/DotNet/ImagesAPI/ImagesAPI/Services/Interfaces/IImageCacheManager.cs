using ImagesAPI.Models;

namespace ImagesAPI.Services.Interfaces
{
    /// <summary>
    /// Service for managing image cache operations
    /// </summary>
    public interface IImageCacheManager
    {
        /// <summary>
        /// Gets all images from cache or creates cache entry
        /// </summary>
        /// <param name="factory">Factory method to create the data if not cached</param>
        /// <returns>List of image models</returns>
        Task<List<ImageModel>?> GetOrCreateAllImagesAsync(Func<Task<List<ImageModel>>> factory);

        /// <summary>
        /// Gets an image from cache or creates cache entry
        /// </summary>
        /// <param name="imageId">The image ID</param>
        /// <param name="factory">Factory method to create the data if not cached</param>
        /// <returns>Image model if found</returns>
        Task<ImageModel?> GetOrCreateImageAsync(string imageId, Func<Task<ImageModel?>> factory);

        /// <summary>
        /// Checks if a filtered image version exists in cache
        /// </summary>
        /// <param name="imageId">The image ID</param>
        /// <param name="filter">The filter name</param>
        /// <param name="cachedResult">The cached result if found</param>
        /// <returns>True if cached version exists</returns>
        bool TryGetFilteredImage(string imageId, string filter, out ImageModel? cachedResult);

        /// <summary>
        /// Caches a filtered image result
        /// </summary>
        /// <param name="imageId">The image ID</param>
        /// <param name="filter">The filter name</param>
        /// <param name="result">The filtered image result</param>
        void CacheFilteredImage(string imageId, string filter, ImageModel result);

        /// <summary>
        /// Clears cache after image upload
        /// </summary>
        /// <param name="imageId">The uploaded image ID</param>
        /// <param name="imageModel">The image model to cache</param>
        Task ClearCacheAfterUploadAsync(string imageId, ImageModel imageModel);

        /// <summary>
        /// Clears cache after image edit
        /// </summary>
        /// <param name="originalId">The original image ID</param>
        /// <param name="newImage">The new image after edit</param>
        Task ClearCacheAfterEditAsync(string originalId, ImageModel newImage);

        /// <summary>
        /// Clears cache after image deletion
        /// </summary>
        /// <param name="imageId">The deleted image ID</param>
        Task ClearCacheAfterDeleteAsync(string imageId);
    }
}
