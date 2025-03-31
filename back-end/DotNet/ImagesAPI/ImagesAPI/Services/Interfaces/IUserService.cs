using ImagesAPI.Models;

namespace ImagesAPI.Services.Interfaces
{
    /// <summary>
    /// Service for user authentication and API key validation
    /// </summary>
    public interface IUserService : ICollectionService<UserModel>
    {
        /// <summary>
        /// Validates an API key and returns the associated user if valid
        /// </summary>
        /// <param name="apiKey">The API key to validate</param>
        /// <returns>The user associated with the API key, or null if the key is invalid</returns>
        Task<UserModel?> ValidateApiKeyAsync(string apiKey);
        
        /// <summary>
        /// Generates a new API key for a user
        /// </summary>
        /// <returns>A new API key</returns>
        string GenerateApiKey();
    }
}