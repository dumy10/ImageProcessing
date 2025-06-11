using Microsoft.AspNetCore.Mvc;

namespace ImagesAPI.Helpers
{
    /// <summary>
    /// Helper class for creating consistent HTTP responses
    /// </summary>
    public static class ResponseHelper
    {
        /// <summary>
        /// Creates a bad request response with error message
        /// </summary>
        /// <param name="controller">The controller instance</param>
        /// <param name="message">The error message</param>
        /// <returns>BadRequest action result</returns>
        public static IActionResult BadRequest(ControllerBase controller, string message)
        {
            return controller.BadRequest(message);
        }

        /// <summary>
        /// Creates a not found response with error message
        /// </summary>
        /// <param name="controller">The controller instance</param>
        /// <param name="message">The error message</param>
        /// <returns>NotFound action result</returns>
        public static IActionResult NotFound(ControllerBase controller, string message)
        {
            return controller.NotFound(message);
        }

        /// <summary>
        /// Creates an internal server error response
        /// </summary>
        /// <param name="controller">The controller instance</param>
        /// <param name="message">Optional error message</param>
        /// <returns>Internal server error action result</returns>
        public static IActionResult InternalServerError(ControllerBase controller, string? message = null)
        {
            return controller.StatusCode(StatusCodes.Status500InternalServerError, message);
        }

        /// <summary>
        /// Creates a not modified response (304)
        /// </summary>
        /// <param name="controller">The controller instance</param>
        /// <returns>Not modified action result</returns>
        public static IActionResult NotModified(ControllerBase controller)
        {
            return controller.StatusCode(StatusCodes.Status304NotModified);
        }

        /// <summary>
        /// Adds cache control headers to response
        /// </summary>
        /// <param name="controller">The controller instance</param>
        /// <param name="maxAge">Max age in seconds</param>
        /// <param name="etag">Optional ETag value</param>
        public static void AddCacheHeaders(ControllerBase controller, int maxAge, string? etag = null)
        {
            controller.Response.Headers.Append("Cache-Control", $"public, max-age={maxAge}");
            
            if (!string.IsNullOrEmpty(etag))
            {
                controller.Response.Headers.Append("ETag", etag);
            }
        }

        /// <summary>
        /// Checks if client has cached version using ETag
        /// </summary>
        /// <param name="controller">The controller instance</param>
        /// <param name="etag">The ETag to check</param>
        /// <returns>True if client has cached version</returns>
        public static bool HasCachedVersion(ControllerBase controller, string etag)
        {
            var clientETag = controller.Request.Headers.IfNoneMatch.FirstOrDefault();
            return clientETag != null && clientETag == etag;
        }
    }
}
