using ImagesAPI.Logger;
using ImagesAPI.Services.Interfaces;
using Microsoft.Extensions.Hosting;

namespace ImagesAPI.Services.Concretes
{
    public class Base64DataMigrationService(IServiceProvider serviceProvider) : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider = serviceProvider;

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Logging.Instance.LogMessage("Base64DataMigrationService started.");

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var imagesCollectionService = scope.ServiceProvider.GetRequiredService<IImagesCollectionService>();
                var dropboxService = scope.ServiceProvider.GetRequiredService<IDropboxService>();

                var images = await imagesCollectionService.GetAll();

                foreach (var image in images)
                {
                    if (stoppingToken.IsCancellationRequested)
                    {
                        break;
                    }

                    bool updated = false;

                    if (string.IsNullOrEmpty(image.Base64Data))
                    {
                        var base64Data = await dropboxService.GetBase64EncodedData(image.Id);
                        if (!string.IsNullOrEmpty(base64Data))
                        {
                            image.Base64Data = base64Data;
                            updated = true;
                        }
                    }

                    if (!string.IsNullOrEmpty(image.ParentId) && string.IsNullOrEmpty(image.ParentBase64Data))
                    {
                        var parentBase64Data = await dropboxService.GetBase64EncodedData(image.ParentId);
                        if (!string.IsNullOrEmpty(parentBase64Data))
                        {
                            image.ParentBase64Data = parentBase64Data;
                            updated = true;
                        }
                    }

                    if (updated)
                    {
                        await imagesCollectionService.Update(image.Id, image);
                        Logging.Instance.LogMessage($"Migrated base64 data for image id: {image.Id}");
                    }
                }
            }
            catch (Exception ex)
            {
                Logging.Instance.LogMessage($"Error in Base64DataMigrationService: {ex.Message}");
            }

            Logging.Instance.LogMessage("Base64DataMigrationService finished.");
        }
    }
}
