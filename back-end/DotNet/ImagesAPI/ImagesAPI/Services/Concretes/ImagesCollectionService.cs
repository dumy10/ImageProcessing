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
        /// <returns>A task representing the asynchronous operation, containing the modified image model.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the id or filter is null or empty.</exception>
        /// <exception cref="ArgumentException">Thrown when the image does not exist or the modified image is invalid.</exception>
        public async Task<ImageModel?> ApplyFilterToImage(string id, string filter, IDriveService driveService)
        {
            // Start tasks in parallel
            // 1. Get image model from database
            // 2. Get image stream from drive service
            var imageModelTask = Get(id);
            var imageStreamTask = driveService.GetStreamForImage(id);

            // Wait for both tasks to complete
            await Task.WhenAll(imageModelTask, imageStreamTask);

            // Check results
            var imageModel = imageModelTask.Result ?? throw new ArgumentException($"The image with the id: {id}, does not exist.");
            var sourceStream = imageStreamTask.Result ?? throw new ArgumentException($"The image with the id: {id}, does not exist.");

            try
            {
                // Create a copy of the memory stream data to avoid issues with stream disposal
                byte[] imageDataCopy = new byte[sourceStream.Length];
                sourceStream.Position = 0;

                await sourceStream.ReadAsync(imageDataCopy.AsMemory(0, (int)sourceStream.Length));
                sourceStream.Position = 0;

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

                var stopwatch = Stopwatch.StartNew();
                
                // Apply the filter to the image
                ImageProcessor.GetFilteredImageData(imageDataCopy, filter.ToLower(), extension.ToLower(), out byte[] modifiedImageData);
                
                stopwatch.Stop();
                Logging.Instance.LogMessage($"Filter {filter} application took {stopwatch.ElapsedMilliseconds}ms");

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
                    AppliedFilters = new List<string>(imageModel.AppliedFilters ?? []) { filter }
                };

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

                // Save the image in the database
                await Create(newImageModel);

                Logging.Instance.LogMessage("Successfully applied filter, uploaded image, and saved to database.");

                return newImageModel;
            }
            catch (Exception ex)
            {
                Logging.Instance.LogError($"Error applying filter: {ex.Message}");
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
    }
}