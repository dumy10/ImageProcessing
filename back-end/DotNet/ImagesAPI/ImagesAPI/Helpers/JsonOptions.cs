using System.Text.Json;

namespace ImagesAPI.Helpers
{
    /// <summary>
    /// Helper class for JSON serialization options
    /// </summary>
    public static class JsonOptions
    {
        /// <summary>
        /// Default JSON serialization options
        /// </summary>
        public static JsonSerializerOptions DefaultOptions { get; } = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }
}
