using Microsoft.AspNetCore.SignalR;

namespace ImagesAPI.Hubs
{
    /// <summary>
    /// SignalR hub for sending progress updates to clients
    /// </summary>
    public class ProgressHub : Hub
    {
        /// <summary>
        /// Sends a progress update to all clients about an image processing operation
        /// </summary>
        /// <param name="imageId">ID of the image being processed</param>
        /// <param name="filter">Filter being applied</param>
        /// <param name="progress">Progress percentage (0-100)</param>
        public async Task SendProgressUpdate(string imageId, string filter, int progress)
        {
            await Clients.All.SendAsync("ReceiveProgressUpdate", imageId, filter, progress);
        }
    }
}