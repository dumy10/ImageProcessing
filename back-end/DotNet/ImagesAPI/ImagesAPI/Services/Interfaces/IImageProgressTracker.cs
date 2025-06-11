namespace ImagesAPI.Services.Interfaces
{
    /// <summary>
    /// Service for tracking image processing progress
    /// </summary>
    public interface IImageProgressTracker
    {
        /// <summary>
        /// Reports progress for an image operation
        /// </summary>
        /// <param name="progressId">The progress tracking ID</param>
        /// <param name="operation">The operation being performed</param>
        /// <param name="progress">Progress percentage (0-100)</param>
        /// <param name="progressTracker">Optional progress tracker service</param>
        Task ReportProgressAsync(string progressId, string operation, int progress, IProgressTrackerService? progressTracker = null);

        /// <summary>
        /// Checks if progress tracking is enabled for the current operation
        /// </summary>
        /// <param name="trackProgress">Flag indicating if progress tracking was requested</param>
        /// <param name="progressTracker">The progress tracker service</param>
        /// <returns>True if progress tracking should be used</returns>
        bool IsProgressTrackingEnabled(bool trackProgress, IProgressTrackerService? progressTracker);

        /// <summary>
        /// Gets or creates a progress ID for tracking
        /// </summary>
        /// <param name="tempId">Optional temporary ID</param>
        /// <returns>Progress tracking ID</returns>
        string GetProgressId(string? tempId);
    }
}
