using ImagesAPI.Services.Interfaces;

namespace ImagesAPI.Services.Concretes
{
    /// <summary>
    /// Implementation of image progress tracking service
    /// </summary>
    public class ImageProgressTracker : IImageProgressTracker
    {
        /// <inheritdoc/>
        public async Task ReportProgressAsync(string progressId, string operation, int progress, IProgressTrackerService? progressTracker = null)
        {
            if (progressTracker != null)
            {
                await progressTracker.ReportProgressAsync(progressId, operation, progress);
            }
        }

        /// <inheritdoc/>
        public bool IsProgressTrackingEnabled(bool trackProgress, IProgressTrackerService? progressTracker)
        {
            return trackProgress && progressTracker != null;
        }

        /// <inheritdoc/>
        public string GetProgressId(string? tempId)
        {
            return string.IsNullOrEmpty(tempId) ? Guid.NewGuid().ToString() : tempId;
        }
    }
}
