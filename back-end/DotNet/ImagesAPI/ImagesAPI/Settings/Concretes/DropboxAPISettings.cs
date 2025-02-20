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
            get
            {
                return "ERXudb-nuuYAAAAAAAAAAex-vPQZ8xZjcNclJqV0e0aBMhlDyrDvN8oTZdekcj0s";
            }
            set
            {

            }
        }
        /// <summary>
        /// Gets or sets the app key used for authenticating with the Dropbox API.
        /// </summary>
        public string AppKey
        {
            get
            {
                return "zf6j1kcgm2vuuq5";
            }
            set
            {
            }
        }
        /// <summary>
        /// Gets or sets the app secret used for authenticating with the Dropbox API.
        /// </summary>
        public string AppSecret
        {
            get
            {
                return "h3ocpjkezi17qxz";
            }
            set
            {
            }
        }
    }
}
