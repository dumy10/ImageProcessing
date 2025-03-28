namespace ImagesAPI.Settings.Interfaces
{
    /// <summary>
    /// Provides settings for accessing the Dropbox API.
    /// </summary>
    public interface IDropboxAPISettings
    {
        /// <summary>
        /// Gets or sets the refresh token for accessing the Dropbox API.
        /// </summary>
        string RefreshToken { get; }
        /// <summary>
        /// Gets or sets the app key for accessing the Dropbox API.
        /// </summary>
        string AppKey { get; }
        /// <summary>
        /// Gets or sets the app secret for accessing the Dropbox API.
        /// </summary>
        string AppSecret { get; }
    }
}
