namespace ImagesAPI.Settings.Interfaces
{
    /// <summary>
    /// Represents the settings required to connect to a MongoDB database.
    /// </summary>
    public interface IMongoDBSettings
    {
        /// <summary>
        /// Gets or sets the name of the images collection in the database.
        /// </summary>
        string ImagesCollectionName { get; }

        /// <summary>
        /// Gets or sets the connection string for the MongoDB database.
        /// </summary>
        string ConnectionString { get; }

        /// <summary>
        /// Gets or sets the name of the MongoDB database.
        /// </summary>
        string DatabaseName { get; }
    }
}
