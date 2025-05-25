namespace ImagesAPI.Services.Interfaces
{
    /// <summary>
    /// Service for tracking progress of image processing operations
    /// </summary>
    public interface IProgressTrackerService
    {
        /// <summary>
        /// Reports progress update for an image processing operation
        /// </summary>
        /// <param name="imageId">ID of the image being processed</param>
        /// <param name="filter">Filter being applied</param>
        /// <param name="progress">Progress percentage (0-100)</param>
        /// <param name="message">Optional message describing the current operation</param>
        /// <returns>Task representing the async operation</returns>
        Task ReportProgressAsync(string imageId, string filter, int progress, string message = "");
    }
}