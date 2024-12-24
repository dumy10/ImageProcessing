using ImagesAPI.External;
using ImagesAPI.Models;
using ImagesAPI.Settings;
using MongoDB.Driver;
using SkiaSharp;

namespace ImagesAPI.Services
{
    /// <summary>
    /// Provides methods to manage image models in the MongoDB collection.
    /// </summary>
    public class ImagesCollectionService : IImagesCollectionService
    {
        private readonly IMongoCollection<ImageModel> _images;

        /// <summary>
        /// Initializes a new instance of the <see cref="ImagesCollectionService"/> class.
        /// </summary>
        /// <param name="settings">The MongoDB settings.</param>
        public ImagesCollectionService(IMongoDBSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);

            _images = database.GetCollection<ImageModel>(settings.ImagesCollectionName);
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

            if (!result.IsAcknowledged && result.DeletedCount == 0)
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
        public async Task<ImageModel> Get(string id)
        {
            return await _images.Find<ImageModel>(image => image.Id == id).FirstOrDefaultAsync();
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
            if (!result.IsAcknowledged && result.ModifiedCount == 0)
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
        /// <param name="googleService">The Google service for image operations.</param>
        /// <returns>A task representing the asynchronous operation, containing the modified image model.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the id or filter is null or empty.</exception>
        /// <exception cref="ArgumentException">Thrown when the image does not exist or the modified image is invalid.</exception>
        public async Task<ImageModel> ApplyFilterToImage(string id, string filter, IGoogleService googleService)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentNullException(nameof(id), "The id parameter cannot be null or empty.");
            }

            ImageModel imageModel = await this.Get(id) ?? throw new ArgumentException($"The image with the id: {id}, does not exist.");

            if (string.IsNullOrWhiteSpace(filter))
            {
                throw new ArgumentNullException(nameof(filter), "The filter parameter cannot be null or empty.");
            }

            using var memoryStream = await googleService.GetStreamForImage(id) ?? throw new ArgumentException($"The image with the id: {id}, does not exist.");

            byte[] imageData = memoryStream.ToArray();

            if (string.IsNullOrWhiteSpace(imageModel.Name))
            {
                imageModel.Name = "Unnamed - " + Guid.NewGuid().ToString() + ".jpg";
            }

            var extension = Path.GetExtension(imageModel.Name);

            // Apply the filter to the image
            ImageProcessor.GetFilteredImageData(imageData, filter.ToLower(), extension.ToLower(), out byte[] modifiedImageData);

            // Get the modified stream
            using var modifiedImageStream = new MemoryStream(modifiedImageData);

            if (string.IsNullOrWhiteSpace(imageModel.ContentType))
            {
                imageModel.ContentType = "image/jpeg";
            }

            // Ensure the modified image stream is valid
            using var skImage = SKImage.FromEncodedData(modifiedImageStream) ?? throw new ArgumentException("The modified image stream is invalid.");

            // Remove the extension
            imageModel.Name = Path.GetFileNameWithoutExtension(imageModel.Name);

            // Add the filter to the name and re-add the extension
            imageModel.Name += $" - {filter}" + extension;

            // Upload the modified image to the drive
            string modifiedImageId = await googleService.UploadImage(modifiedImageStream, imageModel.Name, imageModel.ContentType);

            // Update image model properties
            imageModel.Id = modifiedImageId;
            imageModel.ParentId = id;
            imageModel.ParentUrl = imageModel.Url;
            imageModel.Url = googleService.GetImageURL(modifiedImageId, skImage.Width, skImage.Height);
            imageModel.AppliedFilters ??= []; // Ensure the applied filters list is initialized
            imageModel.AppliedFilters.Add(filter);

            // Save the image in the database
            await this.Create(imageModel);

            return imageModel;
        }
    }
}