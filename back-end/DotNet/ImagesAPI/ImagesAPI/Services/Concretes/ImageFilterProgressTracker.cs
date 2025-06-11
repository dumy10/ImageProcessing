using ImagesAPI.Logger;
using ImagesAPI.Services.Interfaces;

namespace ImagesAPI.Services.Concretes
{
    /// <summary>
    /// Implementation of image filter progress tracking service
    /// </summary>
    public class ImageFilterProgressTracker : IImageFilterProgressTracker
    {
        /// <inheritdoc/>
        public async Task ReportWorkflowProgressAsync(string imageId, string filter, FilterProcessingStage stage, int progress = -1, string message = "", IProgressTrackerService? progressTracker = null)
        {
            if (progressTracker == null) return;

            try
            {
                var progressValue = progress >= 0 ? progress : (int)stage;
                var stageMessage = string.IsNullOrEmpty(message) ? GetStageMessage(stage) : message;

                await progressTracker.ReportProgressAsync(imageId, filter, progressValue, stageMessage);
                Logging.Instance.LogMessage($"Progress update for image {imageId}, filter {filter}: {progressValue}% - {stageMessage}");
            }
            catch (Exception ex)
            {
                // Log but don't fail the operation if progress reporting fails
                Logging.Instance.LogError($"Failed to report progress: {ex.Message}");
            }
        }

        /// <summary>
        /// Gets default message for processing stage
        /// </summary>
        private static string GetStageMessage(FilterProcessingStage stage)
        {
            return stage switch
            {
                FilterProcessingStage.Starting => "Starting filter application",
                FilterProcessingStage.FetchingData => "Fetching image data",
                FilterProcessingStage.DataFetched => "Image data fetched successfully",
                FilterProcessingStage.PreparingData => "Preparing image data for processing",
                FilterProcessingStage.StartingFilter => "Starting filter application",
                FilterProcessingStage.ApplyingFilter => "Applying filter",
                FilterProcessingStage.FilterApplied => "Filter applied successfully, validating result",
                FilterProcessingStage.UploadingResult => "Uploading filtered image",
                FilterProcessingStage.SavingToDatabase => "Saving to database",
                FilterProcessingStage.Completed => "Filter applied successfully",
                FilterProcessingStage.Error => "Error occurred during processing",
                _ => "Processing"
            };
        }
    }
}
