using ImagesAPI.Models;

namespace ImagesAPI.Helpers
{
    /// <summary>
    /// Helper class for authentication and authorization functions
    /// </summary>
    public static class AuthHelper
    {
        /// <summary>
        /// Constant representing the admin user name
        /// </summary>
        public const string ADMIN_USER_NAME = "Admin User";

        /// <summary>
        /// Check if the current user from HttpContext is an admin
        /// </summary>
        /// <param name="httpContext">The current HTTP context</param>
        /// <returns>True if the user is an admin, false otherwise</returns>
        public static bool IsAdmin(HttpContext httpContext)
        {
            if (httpContext == null || !httpContext.Items.ContainsKey("User"))
            {
                return false;
            }

            return httpContext.Items["User"] is UserModel user && user.Name == ADMIN_USER_NAME;
        }

        /// <summary>
        /// Get the current user from HttpContext
        /// </summary>
        /// <param name="httpContext">The current HTTP context</param>
        /// <returns>The current user or null if not authenticated</returns>
        public static UserModel? GetCurrentUser(HttpContext httpContext)
        {
            if (httpContext == null || !httpContext.Items.ContainsKey("User"))
            {
                return null;
            }

            return httpContext.Items["User"] as UserModel;
        }
    }
}