namespace ImagesAPI.Settings
{
    /// <summary>
    /// Provides settings for accessing the Dropbox API.
    /// </summary>
    public interface IDropboxAPISettings
    {
        /// <summary>
        /// Gets or sets the access token used for authenticating with the Dropbox API.
        /// </summary>
        string AccessToken { get; set; }
    }
}
