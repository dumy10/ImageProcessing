namespace ImagesAPI.Settings
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
            get
            {
                return "Images";
            }
            set
            { }
        }

        /// <summary>
        /// Gets or sets the connection string for the MongoDB database.
        /// </summary>
        public string ConnectionString
        {
            get
            {
                return "mongodb://localhost:27017";
            }
            set
            { }
        }

        /// <summary>
        /// Gets or sets the name of the MongoDB database.
        /// </summary>
        public string DatabaseName
        {
            get
            {
                return "imagesManagement";
            }
            set
            { }
        }
    }
}
