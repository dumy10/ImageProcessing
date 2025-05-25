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
    /// Provides methods to manage image models in the MongoDB collection.
    /// </summary>
    public class ImagesCollectionService : IImagesCollectionService
    {
        private readonly IMongoCollection<ImageModel> _images;

        /// <summary>
        /// Initializes a new instance of the <see cref="ImagesCollectionService"/> class. Also used for unit testing.
        /// </summary>
        /// <param name="settings">The MongoDB settings.</param>
        /// <param name="imagesCollection">The collection used for testing. </param>
        public ImagesCollectionService(IMongoDBSettings settings, IMongoCollection<ImageModel>? imagesCollection = null)
        {
            if (imagesCollection != null)
            {
                _images = imagesCollection;
            }
            else
            {
                MongoClientSettings clientSettings = MongoClientSettings.FromUrl(new MongoUrl(settings.ConnectionString));
                clientSettings.SslSettings = new SslSettings() { EnabledSslProtocols = SslProtocols.Tls12 };
                var client = new MongoClient(clientSettings);
                var database = client.GetDatabase(settings.DatabaseName);

                _images = database.GetCollection<ImageModel>(settings.ImagesCollectionName);
            }
        }

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
            // Report initial status if progress tracking is enabled
            await ReportProgressAsync(progressTracker, id, filter, 0, "Starting filter application");

            // Start tasks in parallel
            // 1. Get image model from database
            // 2. Get image stream from drive service
            var imageModelTask = Get(id);
            var imageStreamTask = driveService.GetStreamForImage(id);

            // Report fetching progress if tracking is enabled
            await ReportProgressAsync(progressTracker, id, filter, 5, "Fetching image data");

            // Wait for both tasks to complete
            await Task.WhenAll(imageModelTask, imageStreamTask);

            // Check results
            var imageModel = imageModelTask.Result ?? throw new ArgumentException($"The image with the id: {id}, does not exist.");
            var sourceStream = imageStreamTask.Result ?? throw new ArgumentException($"The image with the id: {id}, does not exist.");

            await ReportProgressAsync(progressTracker, id, filter, 10, "Image data fetched successfully");

            try
            {
                // Create a copy of the memory stream data to avoid issues with stream disposal
                byte[] imageDataCopy = new byte[sourceStream.Length];
                sourceStream.Position = 0;

                await sourceStream.ReadAsync(imageDataCopy.AsMemory(0, (int)sourceStream.Length));
                sourceStream.Position = 0;

                await ReportProgressAsync(progressTracker, id, filter, 15, "Preparing image data for processing");

                // Create a new memory stream from the copied data for SKCodec
                using var skCodecStream = new MemoryStream(imageDataCopy);
                using var skCodec = SKCodec.Create(skCodecStream) ?? throw new ArgumentException("Invalid or corrupted image file.");

                var imageFormat = skCodec.EncodedFormat.ToString().ToLower();

                if (!Enum.TryParse<EAllowedExtensions>(imageFormat.ToUpper(), out _))
                {
                    throw new ArgumentException("Invalid file type. Please make sure the image was not altered. Allowed types: JPEG, JPG, PNG.");
                }

                var extension = string.IsNullOrWhiteSpace(imageModel.Name) ? ".jpg" : Path.GetExtension(imageModel.Name);

                if (string.IsNullOrWhiteSpace(imageModel.Name))
                {
                    imageModel.Name = "Unnamed - " + Guid.NewGuid().ToString() + extension;
                }

                await ReportProgressAsync(progressTracker, id, filter, 20, "Starting filter application");

                var stopwatch = Stopwatch.StartNew();

                // Define progress callback if progress tracking is enabled
                ProgressCallback? progressHandler = null;
                if (progressTracker != null)
                {
                    // Track the highest reported progress to ensure we never go backwards
                    var highestReportedProgress = new ThreadLocal<int>(() => 20);

                    progressHandler = async progress =>
                    {
                        // Map the progress from native code (0-100) to our range (20-80)
                        int mappedProgress = 20 + (int)(progress * 0.6);

                        // Ensure progress never decreases
                        if (mappedProgress > highestReportedProgress.Value)
                        {
                            highestReportedProgress.Value = mappedProgress;
                            await ReportProgressAsync(progressTracker, id, filter, mappedProgress, $"Applying filter: {progress}% complete");
                        }
                    };
                }

                // Apply the filter with optional progress tracking
                ImageProcessor.GetFilteredImageData(imageDataCopy, filter.ToLower(), extension.ToLower(), out byte[] modifiedImageData, progressHandler);

                stopwatch.Stop();
                Logging.Instance.LogMessage($"Filter {filter} application took {stopwatch.ElapsedMilliseconds}ms");

                await ReportProgressAsync(progressTracker, id, filter, 85, "Filter applied successfully, validating result");

                if (string.IsNullOrWhiteSpace(imageModel.ContentType))
                {
                    // Set content type based on extension
                    imageModel.ContentType = extension.ToLower() switch
                    {
                        ".jpg" or ".jpeg" => "image/jpeg",
                        ".png" => "image/png",
                        _ => "image/jpeg"
                    };
                }

                // Validate the modified image data
                using (var validationStream = new MemoryStream(modifiedImageData))
                {
                    validationStream.Position = 0;
                    using var skImage = SKImage.FromEncodedData(validationStream);

                    if (skImage == null)
                    {
                        Logging.Instance.LogError("The modified image data is invalid.");
                        throw new ArgumentException("An error has occurred while filtering the image. Please try again.");
                    }
                }

                // Create a new model 
                var newImageModel = new ImageModel
                {
                    Name = Path.GetFileNameWithoutExtension(imageModel.Name) + $" - {filter}" + extension,
                    ContentType = imageModel.ContentType,
                    ParentId = id,
                    ParentUrl = imageModel.Url,
                    Width = skCodec.Info.Width,
                    Height = skCodec.Info.Height,
                    AppliedFilters = [.. imageModel.AppliedFilters ?? [], filter]
                };

                await ReportProgressAsync(progressTracker, id, filter, 90, "Uploading filtered image");

                // Upload image and get URL in parallel
                using (var uploadStream = new MemoryStream(modifiedImageData))
                {
                    uploadStream.Position = 0;
                    string modifiedImageId = await driveService.UploadImage(uploadStream, newImageModel.Name, newImageModel.ContentType);
                    newImageModel.Id = modifiedImageId;

                    // Get URL and save to database in parallel
                    var getUrlTask = driveService.GetImageURL(modifiedImageId);

                    // Await URL first since it's needed for the model
                    newImageModel.Url = await getUrlTask;
                }

                await ReportProgressAsync(progressTracker, id, filter, 95, "Saving to database");

                // Save the image in the database
                await Create(newImageModel);

                await ReportProgressAsync(progressTracker, id, filter, 100, "Filter applied successfully");

                Logging.Instance.LogMessage("Successfully applied filter, uploaded image, and saved to database.");

                return newImageModel;
            }
            catch (Exception ex)
            {
                Logging.Instance.LogError($"Error applying filter: {ex.Message}");

                // Report error if progress tracking is enabled
                await ReportProgressAsync(progressTracker, id, filter, -1, $"Error: {ex.Message}");

                throw;
            }
            finally
            {
                // Ensure source stream is properly disposed
                if (sourceStream != null)
                {
                    await sourceStream.DisposeAsync();
                }
            }
        }

        /// <summary>
        /// Helper method to report progress through the tracker if available
        /// </summary>
        private static async Task ReportProgressAsync(IProgressTrackerService? progressTracker, string imageId, string filter, int progress, string message = "")
        {
            if (progressTracker != null)
            {
                try
                {
                    await progressTracker.ReportProgressAsync(imageId, filter, progress, message);
                    Logging.Instance.LogMessage($"Progress update for image {imageId}, filter {filter}: {progress}% - {message}");
                }
                catch (Exception ex)
                {
                    // Log but don't fail the operation if progress reporting fails
                    Logging.Instance.LogError($"Failed to report progress: {ex.Message}");
                }
            }
        }
    }
}