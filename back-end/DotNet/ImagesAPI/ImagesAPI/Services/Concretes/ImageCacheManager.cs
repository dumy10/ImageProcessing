using ImagesAPI.Models;
using ImagesAPI.Services.Interfaces;

namespace ImagesAPI.Services.Concretes
{
    /// <summary>
    /// Implementation of image cache management service
    /// </summary>
    public class ImageCacheManager(ICacheService cacheService) : IImageCacheManager
    {
        private readonly ICacheService _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));
        private static readonly SemaphoreSlim _cacheSemaphore = new(1, 1);

        #region Constants
        private const int CACHE_DURATION_SHORT = 5; // minutes
        private const int CACHE_DURATION_MEDIUM = 60; // minutes
        private const string ALL_IMAGES_CACHE_KEY = "all_images";

        #endregion

        /// <inheritdoc/>
        public async Task<List<ImageModel>?> GetOrCreateAllImagesAsync(Func<Task<List<ImageModel>>> factory)
        {
            return await _cacheService.GetOrCreateAsync(ALL_IMAGES_CACHE_KEY, factory, CACHE_DURATION_SHORT);
        }

        /// <inheritdoc/>
        public async Task<ImageModel?> GetOrCreateImageAsync(string imageId, Func<Task<ImageModel?>> factory)
        {
            string cacheKey = GetImageCacheKey(imageId);
            return await _cacheService.GetOrCreateAsync(cacheKey, factory, CACHE_DURATION_MEDIUM);
        }

        /// <inheritdoc/>
        public bool TryGetFilteredImage(string imageId, string filter, out ImageModel? cachedResult)
        {
            string filterCacheKey = GetFilterCacheKey(imageId, filter);
            return _cacheService.TryGetValue(filterCacheKey, out cachedResult);
        }

        /// <inheritdoc/>
        public void CacheFilteredImage(string imageId, string filter, ImageModel result)
        {
            string filterCacheKey = GetFilterCacheKey(imageId, filter);
            _cacheService.Set(filterCacheKey, result, CACHE_DURATION_MEDIUM);
        }

        /// <inheritdoc/>
        public async Task ClearCacheAfterUploadAsync(string imageId, ImageModel imageModel)
        {
            await ExecuteCacheOperationSafelyAsync(() =>
            {
                _cacheService.Remove(ALL_IMAGES_CACHE_KEY);
                _cacheService.Set(GetImageCacheKey(imageId), imageModel, CACHE_DURATION_MEDIUM);
                return Task.CompletedTask;
            });
        }

        /// <inheritdoc/>
        public async Task ClearCacheAfterEditAsync(string originalId, ImageModel newImage)
        {
            await ExecuteCacheOperationSafelyAsync(() =>
            {
                _cacheService.Remove(ALL_IMAGES_CACHE_KEY);
                _cacheService.Remove(GetImageCacheKey(originalId));

                if (newImage.Id != originalId)
                {
                    _cacheService.Remove(GetImageCacheKey(newImage.Id));
                }

                _cacheService.Set(GetImageCacheKey(newImage.Id), newImage, CACHE_DURATION_MEDIUM);
                return Task.CompletedTask;
            });
        }

        /// <inheritdoc/>
        public async Task ClearCacheAfterDeleteAsync(string imageId)
        {
            await ExecuteCacheOperationSafelyAsync(() =>
            {
                _cacheService.Remove(ALL_IMAGES_CACHE_KEY);
                _cacheService.Remove(GetImageCacheKey(imageId));
                return Task.CompletedTask;
            });
        }

        #region Private Methods

        private static string GetImageCacheKey(string imageId) => $"image_{imageId}";
        
        private static string GetFilterCacheKey(string imageId, string filter) => $"image_{imageId}_filter_{filter}";

        private static async Task ExecuteCacheOperationSafelyAsync(Func<Task> action)
        {
            await _cacheSemaphore.WaitAsync();
            try
            {
                await action();
            }
            finally
            {
                _cacheSemaphore.Release();
            }
        }

        #endregion
    }
}
