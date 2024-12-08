using ImagesAPI.Models;

namespace ImagesAPI.Services
{
    public interface IImagesCollectionService : ICollectionService<ImageModel>
    {
        Task<ImageModel> ApplyFilterToImage(string id, string filter, IGoogleService googleService);
    }
}
