using System.Text.Json;

namespace ImagesAPI.Helpers
{
    public static class JsonOptions
    {
        public static JsonSerializerOptions DefaultOptions { get; } = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }
}
