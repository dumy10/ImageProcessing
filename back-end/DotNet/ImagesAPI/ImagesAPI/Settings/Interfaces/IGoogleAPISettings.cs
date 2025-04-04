namespace ImagesAPI.Settings.Interfaces
{
    /// <summary>
    /// Represents the settings required to connect to the Google Drive API.
    /// </summary>
    [Obsolete("This class is not used in the current implementation.")]
    public interface IGoogleAPISettings
    {
        /// <summary>
        /// Gets or sets the name of the key file for the Google Drive API.
        /// </summary>
        string KeyFileName { get; }
        /// <summary>
        /// Gets or sets the identifier of the directory in Google Drive where images are stored.
        /// </summary>
        string DirectoryId { get; }
    }
}
