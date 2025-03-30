using System.ComponentModel.DataAnnotations;

namespace ImagesAPI.Models
{
    /// <summary>
    /// Data Transfer Object for creating a new user
    /// </summary>
    public class CreateUserDTO
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