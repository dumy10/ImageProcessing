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
                return "mongodb://hd-nosql-db:X8rmHFhXq1T2kGAAQeQn50xL2oKiH04fqcqBWc79HhHlYALLUObLaxTvrsuISOYteiI8D9JgjMcuACDbiAqfuA==@hd-nosql-db.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&replicaSet=globaldb&maxIdleTimeMS=120000&appName=@hd-nosql-db@";
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
