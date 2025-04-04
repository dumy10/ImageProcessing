using ImagesAPI.Settings.Interfaces;

namespace ImagesAPI.Settings.Concretes
{
    /// <summary>
    /// Represents the settings required to connect to the Google Drive API.
    /// </summary>
    [Obsolete("This class is not used in the current implementation.")]
    public class GoogleAPISettings : IGoogleAPISettings
    {
        /// <summary>
        /// Gets or sets the name of the key file for the Google Drive API.
        /// </summary>
        public string KeyFileName
        {
            get => string.Empty;
        }
        /// <summary>
        /// Gets or sets the identifier of the directory in Google Drive where images are stored.
        /// </summary>
        public string DirectoryId
        {
            get => string.Empty;
        }
    }
}