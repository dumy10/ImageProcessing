using ImagesAPI.Hubs;
using ImagesAPI.Logger;
using ImagesAPI.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace ImagesAPI.Services.Concretes
{
    /// <summary>
    /// Implementation of progress tracking service using SignalR
    /// </summary>
    /// <remarks>
    /// Initializes a new instance of the ProgressTrackerService
    /// </remarks>
    /// <param name="hubContext">SignalR hub context for sending progress updates</param>
    public class ProgressTrackerService(IHubContext<ProgressHub> hubContext) : IProgressTrackerService
    {
        private readonly IHubContext<ProgressHub> _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));

        /// <summary>
        /// Reports progress update for an image processing operation
        /// </summary>
        /// <param name="imageId">ID of the image being processed</param>
        /// <param name="filter">Filter being applied</param>
        /// <param name="progress">Progress percentage (0-100)</param>
        /// <param name="message">Optional message describing the current operation</param>
        /// <returns>Task representing the async operation</returns>
        public async Task ReportProgressAsync(string imageId, string filter, int progress, string message = "")
        {
            try
            {
                Logging.Instance.LogMessage($"Progress update for image {imageId}, filter {filter}: {progress}% - {message}");
                await _hubContext.Clients.All.SendAsync("ReceiveProgressUpdate", imageId, filter, progress, message);
            }
            catch (Exception ex)
            {
                // Log the error but don't let it crash the application
                Logging.Instance.LogError($"Error reporting progress: {ex.Message}");
            }
        }
    }
}