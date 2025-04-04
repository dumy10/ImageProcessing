using ImagesAPI.Settings.Interfaces;

namespace ImagesAPI.Settings.Concretes
{
    /// <summary>
    /// Implementation of user settings for authentication and rate limiting.
    /// </summary>
    public class UserSettings : IUserSettings
    {
        /// <summary>
        /// Gets the name of the users collection in the database.
        /// </summary>
        public string UsersCollectionName
        {
            get => Environment.GetEnvironmentVariable("MONGODB_USERS_COLLECTION_NAME")!;
        }
        
        /// <summary>
        /// Gets the default rate limit for users in requests per minute.
        /// </summary>
        public int DefaultRateLimit
        {
            get => int.TryParse(Environment.GetEnvironmentVariable("DEFAULT_RATE_LIMIT"), out int limit) ? limit : 60;
        }
        
        /// <summary>
        /// Gets the header name for the API key.
        /// </summary>
        public string ApiKeyHeaderName
        {
            get => Environment.GetEnvironmentVariable("API_KEY_HEADER_NAME") ?? "X-API-Key";
        }
    }
}