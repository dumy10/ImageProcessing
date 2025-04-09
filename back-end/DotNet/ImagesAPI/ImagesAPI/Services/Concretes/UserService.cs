using ImagesAPI.Logger;
using ImagesAPI.Models;
using ImagesAPI.Services.Interfaces;
using ImagesAPI.Settings.Interfaces;
using MongoDB.Driver;
using System.Security.Authentication;
using System.Security.Cryptography;

namespace ImagesAPI.Services.Concretes
{
    /// <summary>
    /// Service for user authentication and API key validation
    /// </summary>
    public class UserService : IUserService
    {
        private readonly IMongoCollection<UserModel> _users;
        private readonly ICacheService _cacheService;

        #region Constants
        private const int DefaultCacheDuration = 30; // Default cache duration in minutes
        private const string CacheKeyPrefix = "user_apikey_";
        #endregion

        /// <summary>
        /// Initializes a new instance of the UserService class
        /// </summary>
        /// <param name="mongoDBSettings">MongoDB settings</param>
        /// <param name="userSettings">User settings</param>
        /// <param name="cacheService">Cache service</param>
        public UserService(IMongoDBSettings mongoDBSettings, IUserSettings userSettings, ICacheService cacheService)
        {
            _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));

            MongoClientSettings clientSettings = MongoClientSettings.FromUrl(new MongoUrl(mongoDBSettings.ConnectionString));
            clientSettings.SslSettings = new SslSettings() { EnabledSslProtocols = SslProtocols.Tls12 };
            var client = new MongoClient(clientSettings);
            var database = client.GetDatabase(mongoDBSettings.DatabaseName);

            _users = database.GetCollection<UserModel>(userSettings.UsersCollectionName);
        }

        /// <summary>
        /// Validates an API key and returns the associated user if valid
        /// </summary>
        /// <param name="apiKey">The API key to validate</param>
        /// <returns>The user associated with the API key, or null if the key is invalid</returns>
        public async Task<UserModel?> ValidateApiKeyAsync(string apiKey)
        {
            if (string.IsNullOrEmpty(apiKey))
                return null;

            // Try to get the user from cache first
            string cacheKey = $"{CacheKeyPrefix}{apiKey}";

            return await _cacheService.GetOrCreateAsync<UserModel?>(cacheKey, async () =>
            {
                try
                {
                    return await _users.Find(u => u.ApiKey == apiKey && u.IsActive).FirstOrDefaultAsync();
                }
                catch (Exception ex)
                {
                    Logging.Instance.LogError($"Error validating API key: {ex.Message}");
                    return null;
                }
            }, DefaultCacheDuration); // Cache for 30 minutes
        }

        /// <summary>
        /// Creates a new user
        /// </summary>
        /// <param name="model">The user model to create</param>
        /// <returns>True if successful</returns>
        public async Task<bool> Create(UserModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Id))
            {
                model.Id = Guid.NewGuid().ToString();
            }

            if (string.IsNullOrWhiteSpace(model.ApiKey))
            {
                model.ApiKey = GenerateApiKey();
            }

            await _users.InsertOneAsync(model);
            return true;
        }

        /// <summary>
        /// Deletes a user
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <returns>True if successful</returns>
        public async Task<bool> Delete(string id)
        {
            var user = await Get(id);
            if (user != null)
            {
                _cacheService.Remove($"{CacheKeyPrefix}{user.ApiKey}");
            }

            var result = await _users.DeleteOneAsync(user => user.Id == id);
            return result.IsAcknowledged && result.DeletedCount > 0;
        }

        /// <summary>
        /// Gets a user by ID
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <returns>The user model</returns>
        public async Task<UserModel?> Get(string id)
        {
            return await _users.Find(user => user.Id == id).FirstOrDefaultAsync();
        }

        /// <summary>
        /// Gets all users
        /// </summary>
        /// <returns>List of all users</returns>
        public async Task<List<UserModel>> GetAll()
        {
            var users = await _users.FindAsync(user => true);
            return await users.ToListAsync();
        }

        /// <summary>
        /// Updates a user
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <param name="model">The updated user model</param>
        /// <returns>True if successful</returns>
        public async Task<bool> Update(string id, UserModel model)
        {
            var existingUser = await Get(id);
            if (existingUser != null)
            {
                _cacheService.Remove($"{CacheKeyPrefix}{existingUser.ApiKey}");
            }

            model.Id = id;
            var result = await _users.ReplaceOneAsync(user => user.Id == id, model);

            if (!result.IsAcknowledged || result.ModifiedCount == 0)
            {
                return false;
            }
            return true;
        }

        /// <summary>
        /// Generates a new API key
        /// </summary>
        /// <returns>A new API key</returns>
        public string GenerateApiKey()
        {
            using var cryptoProvider = RandomNumberGenerator.Create();
            byte[] bytes = new byte[32]; // 256 bits
            cryptoProvider.GetBytes(bytes);
            return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        }
    }
}