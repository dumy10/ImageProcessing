using ImagesAPI.Settings.Interfaces;

namespace ImagesAPI.Settings.Concretes
{
    /// <summary>
    /// Represents the settings required to connect to a MongoDB database.
    /// </summary>
    public class MongoDBSettings : IMongoDBSettings
    {
        /// <summary>
        /// Gets or sets the name of the images collection in the database.
        /// </summary>
        public string ImagesCollectionName
        {
            get => Environment.GetEnvironmentVariable("MONGODB_COLLECTION_NAME")!;
        }

        /// <summary>
        /// Gets or sets the connection string for the MongoDB database.
        /// </summary>
        public string ConnectionString
        {
            get => Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING")!;
        }

        /// <summary>
        /// Gets or sets the name of the MongoDB database.
        /// </summary>
        public string DatabaseName
        {
            get => Environment.GetEnvironmentVariable("MONGODB_DATABASE_NAME")!;
        }
    }
}
