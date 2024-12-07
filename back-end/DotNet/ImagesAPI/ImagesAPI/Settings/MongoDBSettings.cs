namespace ImagesAPI.Settings
{
    public class MongoDBSettings : IMongoDBSettings
    {
        public string ImagesCollectionName
        {
            get
            {
                return "Images";
            }
            set
            { }
        }
        public string ConnectionString
        {
            get
            {
                return "mongodb://localhost:27017";
            }
            set
            { }
        }
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
