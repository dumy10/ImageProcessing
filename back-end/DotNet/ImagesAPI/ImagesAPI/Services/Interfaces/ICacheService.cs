namespace ImagesAPI.Services.Interfaces
{
    /// <summary>
    /// Interface for cache service operations
    /// </summary>
    public interface ICacheService
    {
        /// <summary>
        /// Get a cached item, or create and cache if it doesn't exist
        /// </summary>
        /// <typeparam name="T">Type of the cached item</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="factory">Factory function to create the item if not in cache</param>
        /// <param name="absoluteExpirationMinutes">Optional cache expiration in minutes</param>
        /// <returns>The cached or created item</returns>
        Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, int absoluteExpirationMinutes = 60);
        
        /// <summary>
        /// Store an item in the cache
        /// </summary>
        /// <typeparam name="T">Type of the item to cache</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="value">Value to cache</param>
        /// <param name="absoluteExpirationMinutes">Optional cache expiration in minutes</param>
        void Set<T>(string key, T? value, int absoluteExpirationMinutes = 60);
        
        /// <summary>
        /// Retrieve an item from the cache
        /// </summary>
        /// <typeparam name="T">Type of the cached item</typeparam>
        /// <param name="key">Cache key</param>
        /// <returns>The cached item or default value if not found</returns>
        T? Get<T>(string key);
        
        /// <summary>
        /// Check if an item exists in the cache
        /// </summary>
        /// <param name="key">Cache key</param>
        /// <returns>True if the item exists in cache</returns>
        bool TryGetValue<T>(string key, out T? value);
        
        /// <summary>
        /// Remove an item from the cache
        /// </summary>
        /// <param name="key">Cache key</param>
        void Remove(string key);
    }
}