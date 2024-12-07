using ImagesAPI.Models;
using ImagesAPI.Settings;
using MongoDB.Driver;

namespace ImagesAPI.Services
{
    public class ImagesCollectionService : IImagesCollectionService
    {
        private readonly IMongoCollection<ImageModel> _images;

        public ImagesCollectionService(IMongoDBSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);

            _images = database.GetCollection<ImageModel>(settings.ImagesCollectionName);
        }

        public async Task<bool> Create(ImageModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Id))
            {
                model.Id = Guid.NewGuid().ToString();
            }

            await _images.InsertOneAsync(model);
            return true;
        }

        public async Task<bool> Delete(string id)
        {
            var result = await _images.DeleteOneAsync(image => image.Id == id);

            if (!result.IsAcknowledged && result.DeletedCount == 0)
            {
                return false;
            }

            return true;
        }

        public async Task<ImageModel> Get(string id)
        {
            return await _images.Find<ImageModel>(image => image.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<ImageModel>> GetAll()
        {
            var images = await _images.FindAsync(image => true);
            return await images.ToListAsync();
        }

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

        public Task<ImageModel> ApplyFilterToImage(string id, string filter)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentNullException(nameof(id), "The id parameter cannot be null or empty.");
            }

            ImageModel imageModel = Get(id).Result ?? throw new ArgumentException($"The image with the id: {id}, does not exist.");

            if (string.IsNullOrWhiteSpace(filter))
            {
                throw new ArgumentNullException(nameof(filter), "The filter parameter cannot be null or empty.");
            }

            // fetch the image from the drive using the image.Uri property
            // apply the filter to the image using the filter parameter value (e.g. "grayscale") (will be implemented in a C++ library)
            // save the image to the drive
            // save the image in the database

            throw new NotImplementedException();
        }
    }
}
