namespace ImagesAPI.Models
{
    /// <summary>
    /// Represents an image with metadata and applied filters.
    /// </summary>
    public class ImageModel
    {
        /// <summary>
        /// Gets or sets the unique identifier of the image.
        /// </summary>
        public string? Id { get; set; }

        /// <summary>
        /// Gets or sets the name of the image file.
        /// </summary>
        public string? Name { get; set; }

        /// <summary>
        /// Gets or sets the URL where the image is accessible.
        /// </summary>
        public string? Url { get; set; }

        /// <summary>
        /// Gets or sets the identifier of the parent image, if any.
        /// </summary>
        public string? ParentId { get; set; }

        /// <summary>
        /// Gets or sets the URL of the parent image, if any.
        /// </summary>
        public string? ParentUrl { get; set; }

        /// <summary>
        /// Gets or sets the MIME type of the image.
        /// </summary>
        public string? ContentType { get; set; }

        /// <summary>
        /// Gets or sets the width of the image in pixels.
        /// </summary>
        public int Width { get; set; }

        /// <summary>
        /// Gets or sets the height of the image in pixels.
        /// </summary>
        public int Height { get; set; }

        /// <summary>
        /// Gets or sets the list of filters that have been applied to the image.
        /// </summary>
        public List<string>? AppliedFilters { get; set; }
    }
}
