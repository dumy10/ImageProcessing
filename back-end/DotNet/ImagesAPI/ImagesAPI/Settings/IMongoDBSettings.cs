namespace ImagesAPI.Settings
{
    public interface IMongoDBSettings
    {
        string ImagesCollectionName { get; set; }
        string ConnectionString { get; set; }
        string DatabaseName { get; set; }
    }
}
