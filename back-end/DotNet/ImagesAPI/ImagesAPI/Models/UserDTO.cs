namespace ImagesAPI.Models
{
    /// <summary>
    /// Data Transfer Object (DTO) for user information
    /// </summary>
    public class UserDTO
    {
        /// <summary>
        /// The unique identifier for the user
        /// </summary>
        public required string Id { get; set; }
        /// <summary>
        /// The name of the user
        /// </summary>
        public required string Name { get; set; }
        /// <summary>
        /// The flag indicating whether the user is active
        /// </summary>
        public bool IsActive { get; set; }
        /// <summary>
        /// The rate limit for the user (requests per minute)
        /// </summary>
        public int RateLimit { get; set; }
    }
}
