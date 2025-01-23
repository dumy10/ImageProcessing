namespace ImagesAPI.Settings
{
    /// <summary>
    /// Represents the settings required to connect to the Google Drive API.
    /// </summary>
    public class GoogleAPISettings : IGoogleAPISettings
    {
        /// <summary>
        /// Gets or sets the name of the key file for the Google Drive API.
        /// </summary>
        public string KeyFileName
        {
            get
            {
                return "imageprocessing-drive-api-c7e0d4e4ca93.json";
            }
            set
            {

            }
        }
        /// <summary>
        /// Gets or sets the identifier of the directory in Google Drive where images are stored.
        /// </summary>
        public string DirectoryId
        {
            get
            {
                return "1zOMcdn2GXWvhdgj-bcYqa8_kXsilcOeo";
            }
            set
            {

            }
        }
    }
}