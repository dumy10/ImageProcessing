using MongoDB.Bson.Serialization.Attributes;

namespace ImagesAPI.Models
{
    /// <summary>
    /// Represents a user with API access
    /// </summary>
    public class UserModel
    {
        /// <summary>
        /// Gets or sets the identifier of the user.
        /// </summary>
        [BsonId]
        [BsonElement("_id")]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the name of the user.
        /// </summary>
        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the API key for the user.
        /// </summary>
        [BsonElement("apiKey")]
        public string ApiKey { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets whether the user is active.
        /// </summary>
        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Gets or sets the user's rate limit in requests per minute.
        /// </summary>
        [BsonElement("rateLimit")]
        public int RateLimit { get; set; } = 60; // Default 60 requests per minute
    }
}