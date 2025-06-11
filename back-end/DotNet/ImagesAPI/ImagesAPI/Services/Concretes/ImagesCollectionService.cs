using ImagesAPI.External;
using ImagesAPI.Logger;
using ImagesAPI.Models;
using ImagesAPI.Services.Interfaces;
using ImagesAPI.Settings.Interfaces;
using MongoDB.Driver;
using SkiaSharp;
using System.Diagnostics;
using System.Security.Authentication;

namespace ImagesAPI.Services.Concretes
{
    /// <summary>
    /// Provides methods to manage image models in the MongoDB collection and apply filters to images.
    /// </summary>
    public class ImagesCollectionService : IImagesCollectionService
    {
        private readonly IMongoCollection<ImageModel> _images;
        private readonly IImageFilterProgressTracker _progressTracker;

        #region Constructors
        /// <summary>
        /// Initializes a new instance of the <see cref="ImagesCollectionService"/> class.
        /// </summary>
        /// <param name="settings">The MongoDB settings.</param>
        /// <param name="progressTracker">Progress tracker for filter operations.</param>
        public ImagesCollectionService(IMongoDBSettings settings, IImageFilterProgressTracker progressTracker)
        {
            _progressTracker = progressTracker ?? throw new ArgumentNullException(nameof(progressTracker));
            
            MongoClientSettings clientSettings = MongoClientSettings.FromUrl(new MongoUrl(settings.ConnectionString));
            clientSettings.SslSettings = new SslSettings() { EnabledSslProtocols = SslProtocols.Tls12 };
            var client = new MongoClient(clientSettings);
            var database = client.GetDatabase(settings.DatabaseName);

            _images = database.GetCollection<ImageModel>(settings.ImagesCollectionName);
        }       
        
        /// <summary>
        /// Initializes a new instance of the <see cref="ImagesCollectionService"/> class for testing.
        /// </summary>
        /// <param name="progressTracker">Progress tracker for filter operations.</param>
        /// <param name="imagesCollection">The mongo collection for testing.</param>
        public ImagesCollectionService(IImageFilterProgressTracker progressTracker, IMongoCollection<ImageModel> imagesCollection)
        {
            _progressTracker = progressTracker ?? throw new ArgumentNullException(nameof(progressTracker));
            _images = imagesCollection ?? throw new ArgumentNullException(nameof(imagesCollection));
        }

        #endregion

        #region CRUD Operations
        /// <summary>
        /// Inserts a new image model into the collection.
        /// </summary>
        /// <param name="model">The image model to insert.</param>
        /// <returns>A task representing the asynchronous operation, containing a boolean indicating success.</returns>
        public async Task<bool> Create(ImageModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Id))
            {
                model.Id = Guid.NewGuid().ToString();
            }

            await _images.InsertOneAsync(model);
            return true;
        }

        /// <summary>
        /// Deletes an image model from the collection by its identifier.
        /// </summary>
        /// <param name="id">The identifier of the image model to delete.</param>
        /// <returns>A task representing the asynchronous operation, containing a boolean indicating success.</returns>
        public async Task<bool> Delete(string id)
        {
            var result = await _images.DeleteOneAsync(image => image.Id == id);

            if (!result.IsAcknowledged || result.DeletedCount == 0)
            {
                return false;
            }

            return true;
        }

        /// <summary>
        /// Retrieves an image model from the collection by its identifier.
        /// </summary>
        /// <param name="id">The identifier of the image model to retrieve.</param>
        /// <returns>A task representing the asynchronous operation, containing the image model.</returns>
        public async Task<ImageModel?> Get(string id)
        {
            return await _images.Find(image => image.Id == id).FirstOrDefaultAsync();
        }

        /// <summary>
        /// Retrieves all image models from the collection.
        /// </summary>
        /// <returns>A task representing the asynchronous operation, containing a list of image models.</returns>
        public async Task<List<ImageModel>> GetAll()
        {
            var images = await _images.FindAsync(image => true);
            return await images.ToListAsync();
        }

        /// <summary>
        /// Updates an existing image model in the collection.
        /// </summary>
        /// <param name="id">The identifier of the image model to update.</param>
        /// <param name="model">The updated image model.</param>
        /// <returns>A task representing the asynchronous operation, containing a boolean indicating success.</returns>
        public async Task<bool> Update(string id, ImageModel model)
        {
            model.Id = id;
            var result = await _images.ReplaceOneAsync(image => image.Id == id, model);
            if (!result.IsAcknowledged || result.ModifiedCount == 0)
            {
                await _images.InsertOneAsync(model);
                return false;
            }
            return true;
        }

        #endregion

        #region Image Processing Operations

        /// <summary>
        /// Applies a filter to an image and uploads the modified image.
        /// </summary>
        /// <param name="id">The identifier of the image to modify.</param>
        /// <param name="filter">The name of the filter to apply.</param>
        /// <param name="driveService">The drive service for image operations.</param>
        /// <param name="progressTracker">Optional service for tracking progress updates.</param>
        /// <returns>A task representing the asynchronous operation, containing the modified image model.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the id or filter is null or empty.</exception>
        /// <exception cref="ArgumentException">Thrown when the image does not exist or the modified image is invalid.</exception>
        public async Task<ImageModel?> ApplyFilterToImage(string id, string filter, IDriveService driveService, IProgressTrackerService? progressTracker = null)
        {
            // Report initial status
            await _progressTracker.ReportWorkflowProgressAsync(id, filter, FilterProcessingStage.Starting, progressTracker: progressTracker);

            try
            {
                // Step 1: Fetch image data and metadata
                await _progressTracker.ReportWorkflowProgressAsync(id, filter, FilterProcessingStage.FetchingData, progressTracker: progressTracker);
                var context = await FetchImageDataAsync(id, driveService);
                await _progressTracker.ReportWorkflowProgressAsync(id, filter, FilterProcessingStage.DataFetched, progressTracker: progressTracker);

                // Step 2: Prepare image data for processing
                await _progressTracker.ReportWorkflowProgressAsync(id, filter, FilterProcessingStage.PreparingData, progressTracker: progressTracker);
                var preparedData = await PrepareImageDataAsync(context);

                // Step 3: Apply filter
                await _progressTracker.ReportWorkflowProgressAsync(id, filter, FilterProcessingStage.StartingFilter, progressTracker: progressTracker);
                var filteredData = await ApplyFilterAsync(preparedData, filter, id, progressTracker);
                await _progressTracker.ReportWorkflowProgressAsync(id, filter, FilterProcessingStage.FilterApplied, progressTracker: progressTracker);

                // Step 4: Create and upload result
                await _progressTracker.ReportWorkflowProgressAsync(id, filter, FilterProcessingStage.UploadingResult, progressTracker: progressTracker);
                var newImageModel = await CreateAndUploadFilteredImageAsync(filteredData, context.ImageModel, filter, driveService);

                // Step 5: Save to database
                await _progressTracker.ReportWorkflowProgressAsync(id, filter, FilterProcessingStage.SavingToDatabase, progressTracker: progressTracker);
                await Create(newImageModel);

                // Report completion
                await _progressTracker.ReportWorkflowProgressAsync(id, filter, FilterProcessingStage.Completed, progressTracker: progressTracker);

                Logging.Instance.LogMessage("Successfully applied filter, uploaded image, and saved to database.");

                return newImageModel;
            }
            catch (Exception ex)
            {
                Logging.Instance.LogError($"Error applying filter: {ex.Message}");
                await _progressTracker.ReportWorkflowProgressAsync(id, filter, FilterProcessingStage.Error, message: $"Error: {ex.Message}", progressTracker: progressTracker);
                throw;
            }
        }

        #region Private Filter Processing Methods

        /// <summary>
        /// Fetches image data and metadata for filter processing
        /// </summary>
        private async Task<ImageDataContext> FetchImageDataAsync(string imageId, IDriveService driveService)
        {
            // Start tasks in parallel
            var imageModelTask = Get(imageId);
            var imageStreamTask = driveService.GetStreamForImage(imageId);

            // Wait for both tasks to complete
            await Task.WhenAll(imageModelTask, imageStreamTask);

            var imageModel = imageModelTask.Result ?? throw new ArgumentException($"The image with the id: {imageId}, does not exist.");
            var sourceStream = imageStreamTask.Result ?? throw new ArgumentException($"The image with the id: {imageId}, does not exist.");

            return new ImageDataContext
            {
                ImageModel = imageModel,
                SourceStream = sourceStream,
                ImageId = imageId
            };
        }

        /// <summary>
        /// Prepares image data for filter processing
        /// </summary>
        private static async Task<PreparedImageData> PrepareImageDataAsync(ImageDataContext context)
        {
            try
            {
                // Create a copy of the memory stream data
                byte[] imageDataCopy = new byte[context.SourceStream.Length];
                context.SourceStream.Position = 0;
                await context.SourceStream.ReadAsync(imageDataCopy.AsMemory(0, (int)context.SourceStream.Length));

                // Validate image format using SKCodec
                using var skCodecStream = new MemoryStream(imageDataCopy);
                using var skCodec = SKCodec.Create(skCodecStream) ?? throw new ArgumentException("Invalid or corrupted image file.");

                var imageFormat = skCodec.EncodedFormat.ToString().ToLower();
                if (!Enum.TryParse<EAllowedExtensions>(imageFormat.ToUpper(), out _))
                {
                    throw new ArgumentException("Invalid file type. Please make sure the image was not altered. Allowed types: JPEG, JPG, PNG.");
                }

                var extension = string.IsNullOrWhiteSpace(context.ImageModel.Name) ? ".jpg" : Path.GetExtension(context.ImageModel.Name);
                var imageName = context.ImageModel.Name;

                if (string.IsNullOrWhiteSpace(imageName))
                {
                    imageName = "Unnamed - " + Guid.NewGuid().ToString() + extension;
                }

                var contentType = DetermineContentType(extension, context.ImageModel.ContentType);

                return new PreparedImageData
                {
                    ImageData = imageDataCopy,
                    Extension = extension,
                    ContentType = contentType,
                    Width = skCodec.Info.Width,
                    Height = skCodec.Info.Height,
                    ImageName = imageName
                };
            }
            finally
            {
                // Dispose the source stream
                if (context.SourceStream != null)
                {
                    await context.SourceStream.DisposeAsync();
                }
            }
        }        
        
        /// <summary>
        /// Applies filter to prepared image data
        /// </summary>
        private Task<FilteredImageData> ApplyFilterAsync(PreparedImageData preparedData, string filter, string imageId, IProgressTrackerService? progressTracker)
        {
            var stopwatch = Stopwatch.StartNew();

            // Create progress handler for native code
            ProgressCallback? progressHandler = CreateProgressHandler(imageId, filter, progressTracker);

            // Apply the filter
            ImageProcessor.GetFilteredImageData(preparedData.ImageData, filter.ToLower(), preparedData.Extension.ToLower(), out byte[] modifiedImageData, progressHandler);

            stopwatch.Stop();
            Logging.Instance.LogMessage($"Filter {filter} application took {stopwatch.ElapsedMilliseconds}ms");

            // Validate the result
            ValidateProcessedImageData(modifiedImageData);

            var result = new FilteredImageData
            {
                ProcessedImageData = modifiedImageData,
                OriginalData = preparedData,
                ProcessingTimeMs = stopwatch.ElapsedMilliseconds
            };

            return Task.FromResult(result);
        }

        /// <summary>
        /// Creates and uploads the filtered image
        /// </summary>
        private static async Task<ImageModel> CreateAndUploadFilteredImageAsync(FilteredImageData filteredData, ImageModel originalModel, string filter, IDriveService driveService)
        {
            var preparedData = filteredData.OriginalData;

            // Create new image model
            var newImageModel = new ImageModel
            {
                Name = Path.GetFileNameWithoutExtension(preparedData.ImageName) + $" - {filter}" + preparedData.Extension,
                ContentType = preparedData.ContentType,
                ParentId = originalModel.Id,
                ParentUrl = originalModel.Url,
                Width = preparedData.Width,
                Height = preparedData.Height,
                AppliedFilters = [..originalModel.AppliedFilters ?? [], filter]
            };

            // Upload image and get URL
            using var uploadStream = new MemoryStream(filteredData.ProcessedImageData);
            uploadStream.Position = 0;
            
            string modifiedImageId = await driveService.UploadImage(uploadStream, newImageModel.Name, newImageModel.ContentType);
            newImageModel.Id = modifiedImageId;
            newImageModel.Url = await driveService.GetImageURL(modifiedImageId);

            return newImageModel;
        }

        /// <summary>
        /// Creates progress handler for native filter processing
        /// </summary>
        private ProgressCallback? CreateProgressHandler(string imageId, string filter, IProgressTrackerService? progressTracker)
        {
            if (progressTracker == null) return null;

            var highestReportedProgress = new ThreadLocal<int>(() => 20);

            return async progress =>
            {
                // Map progress from native code (0-100) to our range (20-80)
                int mappedProgress = 20 + (int)(progress * 0.6);

                if (mappedProgress > highestReportedProgress.Value)
                {
                    highestReportedProgress.Value = mappedProgress;
                    await _progressTracker.ReportWorkflowProgressAsync(imageId, filter, FilterProcessingStage.ApplyingFilter, 
                        mappedProgress, $"Applying filter {filter}: {progress}% complete",  progressTracker);
                }
            };
        }

        /// <summary>
        /// Determines content type based on extension
        /// </summary>
        private static string DetermineContentType(string extension, string? existingContentType)
        {
            if (!string.IsNullOrWhiteSpace(existingContentType))
            {
                return existingContentType;
            }

            return extension.ToLower() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "image/jpeg"
            };
        }

        /// <summary>
        /// Validates processed image data
        /// </summary>
        private static void ValidateProcessedImageData(byte[] imageData)
        {
            using var validationStream = new MemoryStream(imageData);
            validationStream.Position = 0;
            using var skImage = SKImage.FromEncodedData(validationStream);

            if (skImage == null)
            {
                Logging.Instance.LogError("The modified image data is invalid.");
                throw new ArgumentException("An error has occurred while filtering the image. Please try again.");
            }
        }

        #endregion

        #region Data Transfer Objects

        /// <summary>
        /// Context containing image data and metadata
        /// </summary>
        private class ImageDataContext
        {
            public ImageModel ImageModel { get; set; } = null!;
            public MemoryStream SourceStream { get; set; } = null!;
            public string ImageId { get; set; } = string.Empty;
        }

        /// <summary>
        /// Prepared image data for processing
        /// </summary>
        private class PreparedImageData
        {
            public byte[] ImageData { get; set; } = [];
            public string Extension { get; set; } = string.Empty;
            public string ContentType { get; set; } = string.Empty;
            public int Width { get; set; }
            public int Height { get; set; }
            public string ImageName { get; set; } = string.Empty;
        }

        /// <summary>
        /// Filtered image data result
        /// </summary>
        private class FilteredImageData
        {
            public byte[] ProcessedImageData { get; set; } = [];
            public PreparedImageData OriginalData { get; set; } = null!;
            public long ProcessingTimeMs { get; set; }
        }

        #endregion
        #endregion
    }
}