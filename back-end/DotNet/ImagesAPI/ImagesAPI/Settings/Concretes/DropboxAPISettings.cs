using ImagesAPI.Settings.Interfaces;

namespace ImagesAPI.Settings.Concretes
{
    /// <summary>
    /// Provides settings for accessing the Dropbox API.
    /// </summary>
    public class DropboxAPISettings : IDropboxAPISettings
    {
        /// <summary>
        /// Gets or sets the refresh token used for authenticating with the Dropbox API.
        /// </summary>
        public string RefreshToken
        {
            get => Environment.GetEnvironmentVariable("DROPBOX_REFRESH_TOKEN")!;
        }
        /// <summary>
        /// Gets or sets the app key used for authenticating with the Dropbox API.
        /// </summary>
        public string AppKey
        {
            get => Environment.GetEnvironmentVariable("DROPBOX_APP_KEY")!;
        }
        /// <summary>
        /// Gets or sets the app secret used for authenticating with the Dropbox API.
        /// </summary>
        public string AppSecret
        {
            get => Environment.GetEnvironmentVariable("DROPBOX_APP_SECRET")!;
        }
    }
}
