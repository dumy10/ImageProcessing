using System.ComponentModel.DataAnnotations;

namespace ImagesAPI.Models
{
    /// <summary>
    /// Base class for user-related Data Transfer Objects (DTOs) with common properties
    /// </summary>
    public class UserDTOBase
    {
        /// <summary>
        /// The name of the user
        /// </summary>
        [Required]
        public required string Name { get; set; }

        /// <summary>
        /// The rate limit for the user (requests per minute)
        /// </summary>
        [Required]
        public int RateLimit { get; set; }
    }
}
