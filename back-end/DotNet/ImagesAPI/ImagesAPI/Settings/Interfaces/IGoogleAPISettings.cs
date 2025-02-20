namespace ImagesAPI.Settings.Interfaces
{
    /// <summary>
    /// Represents the settings required to connect to the Google Drive API.
    /// </summary>
    public interface IGoogleAPISettings
    {
        /// <summary>
        /// Gets or sets the name of the key file for the Google Drive API.
        /// </summary>
        string KeyFileName { get; set; }
        /// <summary>
        /// Gets or sets the identifier of the directory in Google Drive where images are stored.
        /// </summary>
        string DirectoryId { get; set; }
    }
}
