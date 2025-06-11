using MongoDB.Bson.Serialization.Attributes;

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
        [BsonId]
        [BsonElement("_id")]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the name of the image file.
        /// </summary>
        [BsonElement("Name")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the URL where the image is accessible.
        /// </summary>
        [BsonElement("Url")]
        public string Url { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the identifier of the parent image, if any.
        /// </summary>
        [BsonElement("ParentId")]
        public string ParentId { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the URL of the parent image, if any.
        /// </summary>
        [BsonElement("ParentUrl")]
        public string ParentUrl { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the MIME type of the image.
        /// </summary>
        [BsonElement("ContentType")]
        public string ContentType { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the width of the image in pixels.
        /// </summary>
        [BsonElement("Width")]
        public int Width { get; set; }

        /// <summary>
        /// Gets or sets the height of the image in pixels.
        /// </summary>
        [BsonElement("Height")]
        public int Height { get; set; }

        /// <summary>
        /// Gets or sets the list of filters that have been applied to the image.
        /// </summary>
        [BsonElement("AppliedFilters")]
        public List<string> AppliedFilters { get; set; } = [];
    }
}
