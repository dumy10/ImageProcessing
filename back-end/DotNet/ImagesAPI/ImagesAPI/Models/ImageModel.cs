namespace ImagesAPI.Models
{
    public class ImageModel
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? Url { get; set; }
        public string? ParentId { get; set; }
        public string? ParentUrl { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public List<string>? AppliedFilters { get; set; }
    }
}
