using System.ComponentModel.DataAnnotations;

namespace ImagesAPI.Models
{
    /// <summary>
    /// Data Transfer Object for updating a user
    /// </summary>
    public class UpdateUserDTO
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