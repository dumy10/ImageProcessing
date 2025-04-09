using ImagesAPI.Logger;
using ImagesAPI.Models;
using ImagesAPI.Services.Interfaces;
using ImagesAPI.Settings.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;
using System.Net;

namespace ImagesAPI.Middleware
{
    /// <summary>
    /// Middleware for API key authentication and rate limiting
    /// </summary>
    /// <remarks>
    /// Initializes a new instance of the ApiKeyAuthenticationMiddleware class
    /// </remarks>
    /// <param name="next">The next delegate in the pipeline</param>
    /// <param name="userSettings">User settings</param>
    /// <param name="cache">Memory cache</param>
    public class ApiKeyAuthenticationMiddleware(RequestDelegate next, IUserSettings userSettings)
    {
        private readonly RequestDelegate _next = next ?? throw new ArgumentNullException(nameof(next));
        private readonly IUserSettings _userSettings = userSettings ?? throw new ArgumentNullException(nameof(userSettings));
        
        // Store rate limiting data
        private static readonly ConcurrentDictionary<string, RateLimitInfo> _rateLimits = new();

        // List of paths that don't require authentication
        private static readonly HashSet<string> _publicPaths = ["/", "/health", "/progressHub/negotiate", "/progressHub"];

        /// <summary>
        /// Invokes the middleware
        /// </summary>
        /// <param name="context">The HTTP context</param>
        /// <param name="userService">User service</param>
        /// <returns>A task representing the asynchronous operation</returns>
        public async Task InvokeAsync(HttpContext context, IUserService userService)
        {
            // Skip authentication for public paths
            string path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;
            if (_publicPaths.Any(p => path.Equals(p, StringComparison.OrdinalIgnoreCase)))
            {
                Logging.Instance.LogMessage($"Skipping authentication for public path: {path}");
                await _next(context);
                return;
            }

            // Check if API key is provided
            if (!context.Request.Headers.TryGetValue(_userSettings.ApiKeyHeaderName, out var apiKeyHeaderValues))
            {
                Logging.Instance.LogWarning("API request without API key");
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                await context.Response.WriteAsJsonAsync(new { message = "API key is required" });
                return;
            }

            string apiKey = apiKeyHeaderValues.ToString();
            
            // Validate API key
            var user = await userService.ValidateApiKeyAsync(apiKey);
            
            if (user == null)
            {
                Logging.Instance.LogWarning($"Invalid API key: {apiKey}");
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                await context.Response.WriteAsJsonAsync(new { message = "Invalid API key" });
                return;
            }

            // Check rate limit for the user
            if (!CheckRateLimit(context, user))
            {
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                await context.Response.WriteAsJsonAsync(new { message = "Rate limit exceeded" });
                return;
            }

            // Store user in HttpContext for use in controllers
            context.Items["User"] = user;

            // Continue with the pipeline
            await _next(context);
        }

        private static bool CheckRateLimit(HttpContext context, UserModel user)
        {
            var key = user.ApiKey;
            var now = DateTime.UtcNow;

            // Get or initialize rate limit info for this API key
            var rateInfo = _rateLimits.GetOrAdd(key, _ => new RateLimitInfo { 
                WindowStart = now,
                Count = 0,
                RateLimit = user.RateLimit
            });

            // Check if we need to reset the window
            if ((now - rateInfo.WindowStart).TotalMinutes >= 1)
            {
                rateInfo.WindowStart = now;
                rateInfo.Count = 0;
            }

            // Update request count 
            var currentCount = Interlocked.Increment(ref rateInfo._count);

            // Add headers to response with rate limit information
            context.Response.OnStarting(() => {
                context.Response.Headers.Append("X-RateLimit-Limit", rateInfo.RateLimit.ToString());
                context.Response.Headers.Append("X-RateLimit-Remaining", Math.Max(0, rateInfo.RateLimit - currentCount).ToString());
                context.Response.Headers.Append("X-RateLimit-Reset", ((int)(rateInfo.WindowStart.AddMinutes(1) - DateTime.UtcNow).TotalSeconds).ToString());
                return Task.CompletedTask;
            });

            // Return whether the request is within the rate limit
            return currentCount <= rateInfo.RateLimit;
        }

        /// <summary>
        /// Class to track rate limit information
        /// </summary>
        private class RateLimitInfo
        {
            public DateTime WindowStart { get; set; }
            // Change Count from property to field to use with ref
            public int _count;
            public int Count 
            { 
                get => _count; 
                set => _count = value; 
            }
            public int RateLimit { get; set; }
        }
    }

    /// <summary>
    /// Extension methods for ApiKeyAuthenticationMiddleware
    /// </summary>
    public static class ApiKeyAuthenticationMiddlewareExtensions
    {
        /// <summary>
        /// Adds API key authentication and rate limiting to the application
        /// </summary>
        /// <param name="builder">The application builder</param>
        /// <returns>The application builder</returns>
        public static IApplicationBuilder UseApiKeyAuthentication(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ApiKeyAuthenticationMiddleware>();
        }
    }
}