namespace ImagesAPI.Services.Interfaces
{
    /// <summary>
    /// Service for tracking image filter processing progress
    /// </summary>
    public interface IImageFilterProgressTracker
    {
        /// <summary>
        /// Reports progress for image filter processing workflow
        /// </summary>
        /// <param name="imageId">The image ID being processed</param>
        /// <param name="filter">The filter being applied</param>
        /// <param name="stage">The current processing stage</param>
        /// <param name="progress">Progress percentage (0-100)</param>
        /// <param name="message">Optional message</param>
        /// <param name="progressTracker">The underlying progress tracker</param>
        Task ReportWorkflowProgressAsync(string imageId, string filter, FilterProcessingStage stage, int progress = -1, string message = "", IProgressTrackerService? progressTracker = null);
    }

    /// <summary>
    /// Stages in the image filter processing workflow
    /// </summary>
    public enum FilterProcessingStage
    {
        Starting = 0,
        FetchingData = 5,
        DataFetched = 10,
        PreparingData = 15,
        StartingFilter = 20,
        ApplyingFilter = 50, // Range 20-80
        FilterApplied = 85,
        UploadingResult = 90,
        SavingToDatabase = 95,
        Completed = 100,
        Error = -1
    }
}
