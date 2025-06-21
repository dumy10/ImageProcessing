using ImagesAPI.Logger;
using ImagesAPI.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace ImagesAPI.Services.Concretes
{
    /// <summary>
    /// Implementation of ICacheService using IMemoryCache
    /// </summary>
    /// <remarks>
    /// Constructor that accepts an IMemoryCache instance
    /// </remarks>
    /// <param name="memoryCache">The memory cache instance</param>
    public class MemoryCacheService(IMemoryCache memoryCache) : ICacheService
    {
        private readonly IMemoryCache _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

        // Default size for non-binary objects
        private const long DefaultObjectSize = 1024; // 1KB default size

        /// <inheritdoc/>
        public T? Get<T>(string key)
        {
            return _memoryCache.Get<T>(key);
        }

        /// <inheritdoc/>
        public async Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, int absoluteExpirationMinutes = 60)
        {
            return await _memoryCache.GetOrCreateAsync(key, async entry =>
            {
                // Set cache entry options
                entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(absoluteExpirationMinutes));

                // Create the item if it doesn't exist in cache
                var result = await factory();

                // Set size based on content type
                if (result is byte[] byteArray)
                {
                    entry.SetSize(byteArray.Length);
                }
                else if (result is MemoryStream memStream)
                {
                    entry.SetSize(memStream.Length);
                }
                else if (result != null)
                {
                    // Estimate size for other object types based on JSON serialization
                    try
                    {
                        var jsonSize = JsonSerializer.Serialize(result).Length;
                        entry.SetSize(Math.Max(jsonSize, DefaultObjectSize));
                    }
                    catch
                    {
                        // If serialization fails, use default size
                        entry.SetSize(DefaultObjectSize);
                    }
                }
                else
                {
                    // Null objects still need a size
                    entry.SetSize(8); // Small placeholder size for null values
                }

                return result;
            });
        }

        /// <inheritdoc/>
        public void Remove(string key)
        {
            _memoryCache.Remove(key);
        }

        /// <inheritdoc/>
        public void Set<T>(string key, T? value, int absoluteExpirationMinutes = 60)
        {
            var cacheEntryOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(absoluteExpirationMinutes))
                .SetSlidingExpiration(TimeSpan.FromMinutes(absoluteExpirationMinutes / 2));

            // Add eviction callback
            cacheEntryOptions.RegisterPostEvictionCallback((evictedKey, evictedValue, reason, state) =>
            {
                if (reason == EvictionReason.Capacity)
                {
                    Logging.Instance.LogWarning($"Cache item '{evictedKey}' evicted due to capacity limits.");
                }
            });

            // Set size based on content type
            if (value is byte[] byteArray)
            {
                cacheEntryOptions.SetSize(byteArray.Length);
            }
            else if (value is MemoryStream memStream)
            {
                cacheEntryOptions.SetSize(memStream.Length);
            }
            else if (value != null)
            {
                // Estimate size for other object types based on JSON serialization
                try
                {
                    var jsonSize = JsonSerializer.Serialize(value).Length;
                    cacheEntryOptions.SetSize(Math.Max(jsonSize, DefaultObjectSize));
                }
                catch
                {
                    // If serialization fails, use default size
                    cacheEntryOptions.SetSize(DefaultObjectSize);
                }
            }
            else
            {
                // Null objects still need a size
                cacheEntryOptions.SetSize(8); // Small placeholder size for null values
            }
            Logging.Instance.LogMessage($"Setting cache for key '{key}' with size {cacheEntryOptions.Size} bytes and expiration of {absoluteExpirationMinutes} minutes.");
            _memoryCache.Set(key, value, cacheEntryOptions);
        }

        /// <inheritdoc/>
        public bool TryGetValue<T>(string key, out T? value)
        {
            return _memoryCache.TryGetValue(key, out value!);
        }
    }
}