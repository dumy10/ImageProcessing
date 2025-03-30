namespace ImagesAPI.Settings.Interfaces
{
    /// <summary>
    /// Represents the settings required for user authentication and rate limiting.
    /// </summary>
    public interface IUserSettings
    {
        /// <summary>
        /// Gets the name of the users collection in the database.
        /// </summary>
        string UsersCollectionName { get; }
        
        /// <summary>
        /// Gets the default rate limit for users in requests per minute.
        /// </summary>
        int DefaultRateLimit { get; }
        
        /// <summary>
        /// Gets the header name for the API key.
        /// </summary>
        string ApiKeyHeaderName { get; }
    }
}