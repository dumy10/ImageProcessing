using ImagesAPI.Helpers;
using ImagesAPI.Logger;
using ImagesAPI.Models;
using ImagesAPI.Services.Interfaces;
using ImagesAPI.Validators;
using Microsoft.AspNetCore.Mvc;
using SkiaSharp;

namespace ImagesAPI.Controllers
{    
    /// <summary>
    /// Controller for managing image-related actions.
    /// </summary>
    /// <param name="imagesCollectionService">Service for image collection operations</param>
    /// <param name="dropboxService">Service for Dropbox operations</param>
    /// <param name="cacheManager">Service for advanced caching operations</param>
    /// <param name="progressTracker">Service for progress tracking</param>
    [ApiController]
    [Route("[controller]")]
    [ResponseCache(VaryByHeader = "Accept, Accept-Encoding", Location = ResponseCacheLocation.Any)]
    public class ImagesController(
        IImagesCollectionService imagesCollectionService, 
        IDropboxService dropboxService, 
        IImageCacheManager cacheManager,
        IImageProgressTracker progressTracker) : ControllerBase
    {
        private readonly IImagesCollectionService _imagesCollectionService = imagesCollectionService ?? throw new ArgumentNullException(nameof(imagesCollectionService));
        private readonly IDropboxService _dropboxService = dropboxService ?? throw new ArgumentNullException(nameof(dropboxService));
        private readonly IImageCacheManager _cacheManager = cacheManager ?? throw new ArgumentNullException(nameof(cacheManager));
        private readonly IImageProgressTracker _progressTracker = progressTracker ?? throw new ArgumentNullException(nameof(progressTracker));
        private readonly ImageUploadValidator _validator = new();
        
        /// <summary>
        /// Retrieves all images.
        /// </summary>
        /// <returns>A list of all image models.</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ResponseCache(Duration = 300)]
        public async Task<IActionResult> GetImages()
        {
            Logging.Instance.LogMessage("Retrieving all images...");
            try
            {
                var images = await _cacheManager.GetOrCreateAllImagesAsync(() => _imagesCollectionService.GetAll());

                if (images == null || images.Count == 0)
                {
                    Logging.Instance.LogWarning("No images found.");
                    return ResponseHelper.NotFound(this, "No images found.");
                }

                ResponseHelper.AddCacheHeaders(this, maxAge: 300);
                Logging.Instance.LogMessage("Images retrieved successfully.");
                return Ok(images);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return ResponseHelper.InternalServerError(this);
            }
        }        
        
        /// <summary>
        /// Retrieves an image by its identifier.
        /// </summary>
        /// <param name="id">The identifier of the image.</param>
        /// <returns>The image model if found; otherwise, a 404 response.</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status304NotModified)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ResponseCache(Duration = 3600)]
        public async Task<IActionResult> GetImage(string id)
        {
            Logging.Instance.LogMessage($"Retrieving image with ID {id}...");
            try
            {
                var etagValue = $"\"{id}\"";

                if (ResponseHelper.HasCachedVersion(this, etagValue))
                {
                    return ResponseHelper.NotModified(this);
                }

                var image = await _cacheManager.GetOrCreateImageAsync(id, () => _imagesCollectionService.Get(id));

                if (image == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found.");
                    return ResponseHelper.NotFound(this, $"Image with ID {id} not found.");
                }

                ResponseHelper.AddCacheHeaders(this, maxAge: 3600, etagValue);
                Logging.Instance.LogMessage($"Image with ID {id} retrieved successfully.");

                return Ok(image);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return ResponseHelper.InternalServerError(this);
            }
        }

        /// <summary>
        /// Uploads a new image to the server.
        /// </summary>
        /// <param name="image">The image file to upload.</param>
        /// <param name="trackProgress">Optional query parameter to enable progress tracking (default: false)</param>
        /// <param name="tempId">Optional query parameter with temporary ID for progress tracking</param>
        /// <param name="progressTrackerService">The SignalR progress tracker service (injected when needed)</param>
        /// <returns>The uploaded image model.</returns>
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [DisableRequestSizeLimit]
        [ResponseCache(NoStore = true)]
        public async Task<IActionResult> UploadImage(IFormFile? image, [FromQuery] bool trackProgress = false, [FromQuery] string? tempId = null, [FromServices] IProgressTrackerService? progressTrackerService = null)
        {
            var useProgressTracking = _progressTracker.IsProgressTrackingEnabled(trackProgress, progressTrackerService);
            var progressId = _progressTracker.GetProgressId(tempId);

            Logging.Instance.LogMessage("Uploading image..." + (useProgressTracking ? $" with progress tracking (ID: {progressId})" : ""));

            // Validate file
            var fileValidation = _validator.ValidateFile(image);
            if (!fileValidation.IsValid)
            {
                Logging.Instance.LogWarning(fileValidation.ErrorMessage);
                return ResponseHelper.BadRequest(this, fileValidation.ErrorMessage);
            }

            try
            {
                await _progressTracker.ReportProgressAsync(progressId, "upload", 0, progressTrackerService);                
                var (memoryStream, contentValidation) = await ProcessImageContentAsync(image!, progressId, progressTrackerService);
                if (!contentValidation.IsValid)
                {
                    memoryStream?.Dispose();
                    return ResponseHelper.BadRequest(this, contentValidation.ErrorMessage);
                }

                await _progressTracker.ReportProgressAsync(progressId, "upload", 60, progressTrackerService);

                var imageModel = await UploadAndCreateImageModelAsync(image!, contentValidation, progressId, progressTrackerService);

                memoryStream?.Dispose();
                await _progressTracker.ReportProgressAsync(progressId, "upload", 100, progressTrackerService);

                Logging.Instance.LogMessage("Image uploaded successfully.");
                return Ok(imageModel);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return ResponseHelper.InternalServerError(this);
            }
        }       
        
        /// <summary>
        /// Processes and validates image content
        /// </summary>
        private async Task<(MemoryStream, ImageValidationResult)> ProcessImageContentAsync(IFormFile image, string progressId, IProgressTrackerService? progressTrackerService)
        {
            var memoryStream = new MemoryStream();
            await image.CopyToAsync(memoryStream);

            await _progressTracker.ReportProgressAsync(progressId, "upload", 20, progressTrackerService);

            var contentValidation = _validator.ValidateImageContent(memoryStream);
            
            await _progressTracker.ReportProgressAsync(progressId, "upload", 40, progressTrackerService);

            return (memoryStream, contentValidation);
        }        
        
        /// <summary>
        /// Uploads image and creates the image model
        /// </summary>
        private async Task<ImageModel> UploadAndCreateImageModelAsync(IFormFile image, ImageValidationResult validation, string progressId, IProgressTrackerService? progressTrackerService)
        {
            var imageId = await _dropboxService.UploadImage(image);

            if (string.IsNullOrWhiteSpace(imageId))
            {
                throw new InvalidOperationException("Error uploading the image.");
            }

            await _progressTracker.ReportProgressAsync(progressId, "upload", 80, progressTrackerService);

            var imageModel = new ImageModel
            {
                Id = imageId,
                Name = image.FileName,
                Width = validation.Width,
                Height = validation.Height,
                ContentType = image.ContentType,
                Url = await _dropboxService.GetImageURL(imageId),
                Base64Data = await _dropboxService.GetBase64EncodedData(imageId)
            };

            await _imagesCollectionService.Create(imageModel);
            await _cacheManager.ClearCacheAfterUploadAsync(imageId, imageModel);

            return imageModel;
        }        
        
        /// <summary>
        /// Applies a filter to an existing image with optional real-time progress tracking via SignalR.
        /// </summary>
        /// <param name="id">The identifier of the image to edit.</param>
        /// <param name="filter">The filter to apply to the image.</param>
        /// <param name="trackProgress">Optional query parameter to enable progress tracking (default: false)</param>
        /// <param name="progressTracker">The SignalR progress tracker service (injected when needed)</param>
        /// <returns>The modified image model.</returns>
        [HttpPut("edit/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ResponseCache(NoStore = true)]
        public async Task<IActionResult> EditImage(string id, [FromBody] string filter, [FromQuery] bool trackProgress = false, [FromServices] IProgressTrackerService? progressTracker = null)
        {
            var useProgressTracking = _progressTracker.IsProgressTrackingEnabled(trackProgress, progressTracker);

            Logging.Instance.LogMessage($"Applying filter {filter} to image with ID {id}..." + (useProgressTracking ? " with progress tracking" : ""));

            // Validate filter
            var filterValidation = _validator.ValidateFilter(filter);
            if (!filterValidation.IsValid)
            {
                Logging.Instance.LogWarning(filterValidation.ErrorMessage);
                return ResponseHelper.BadRequest(this, filterValidation.ErrorMessage);
            }

            try
            {
                // Check cache first
                if (_cacheManager.TryGetFilteredImage(id, filterValidation.NormalizedFilter, out var cachedResult) && cachedResult != null)
                {
                    await HandleCachedFilterResult(id, filterValidation.NormalizedFilter, useProgressTracking, progressTracker);
                    return Ok(cachedResult);
                }

                var newImage = await ApplyFilterToImageAsync(id, filterValidation.NormalizedFilter, useProgressTracking, progressTracker);

                if (newImage == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found or filter could not be applied.");
                    return ResponseHelper.NotFound(this, $"Image with ID {id} not found.");
                }

                await CacheFilterResultAsync(id, filterValidation.NormalizedFilter, newImage);

                Logging.Instance.LogMessage($"Filter {filterValidation.NormalizedFilter} applied successfully to image with ID {id}.");
                return Ok(newImage);
            }
            catch (ArgumentNullException error)
            {
                Logging.Instance.LogError(error.Message);
                return ResponseHelper.BadRequest(this, error.Message);
            }
            catch (ArgumentException error)
            {
                Logging.Instance.LogWarning(error.Message);
                return ResponseHelper.NotFound(this, error.Message);
            }
            catch (InvalidOperationException error)
            {
                Logging.Instance.LogError(error.Message);
                return ResponseHelper.BadRequest(this, error.Message);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return ResponseHelper.InternalServerError(this);
            }
        }

        /// <summary>
        /// Handles cached filter result with progress reporting
        /// </summary>
        private async Task HandleCachedFilterResult(string id, string filter, bool useProgressTracking, IProgressTrackerService? progressTracker)
        {
            if (useProgressTracking && progressTracker != null)
            {
                Logging.Instance.LogMessage($"Reporting immediate completion for cached result of {id} with filter {filter}");
                await _progressTracker.ReportProgressAsync(id, filter, 0, progressTracker);
                await _progressTracker.ReportProgressAsync(id, filter, 100, progressTracker);
            }

            Logging.Instance.LogMessage($"Returning cached filtered image for ID {id} with filter {filter}");
        }

        /// <summary>
        /// Applies filter to image
        /// </summary>
        private async Task<ImageModel?> ApplyFilterToImageAsync(string id, string filter, bool useProgressTracking, IProgressTrackerService? progressTracker)
        {
            return await _imagesCollectionService.ApplyFilterToImage(id, filter, _dropboxService, useProgressTracking ? progressTracker : null);
        }

        /// <summary>
        /// Caches filter result and clears related cache entries
        /// </summary>
        private async Task CacheFilterResultAsync(string originalId, string filter, ImageModel newImage)
        {
            _cacheManager.CacheFilteredImage(originalId, filter, newImage);
            await _cacheManager.ClearCacheAfterEditAsync(originalId, newImage);
        }        
        
        /// <summary>
        /// Deletes an image by its identifier, removing it from both the database and the drive.
        /// </summary>
        /// <param name="id">The identifier of the image to delete.</param>
        /// <returns>An IActionResult indicating the outcome of the operation.</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ResponseCache(NoStore = true)]
        public async Task<IActionResult> DeleteImage(string id)
        {
            Logging.Instance.LogMessage($"Deleting image with ID {id}...");
            try
            {
                var image = await _imagesCollectionService.Get(id);

                if (image == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found.");
                    return ResponseHelper.NotFound(this, $"Image with ID {id} not found.");
                }

                if (!await _dropboxService.DeleteImage(id))
                {
                    Logging.Instance.LogError("Error deleting the image from drive.");
                    return ResponseHelper.BadRequest(this, "Error deleting the image from storage.");
                }

                if (!await _imagesCollectionService.Delete(id))
                {
                    Logging.Instance.LogError("Error deleting the image from the database.");
                    return ResponseHelper.BadRequest(this, "Image was deleted from storage but could not be removed from the database.");
                }

                await _cacheManager.ClearCacheAfterDeleteAsync(id);

                Logging.Instance.LogMessage($"Image with ID {id} deleted successfully.");
                return Ok();
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return ResponseHelper.InternalServerError(this);
            }
        }        
        
        /// <summary>
        /// Downloads an image by its identifier.
        /// </summary>
        /// <param name="id"></param>
        /// <returns>An IActionResult indicating the outcome of the operation.</returns>
        [HttpGet("download/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status304NotModified)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ResponseCache(Duration = 86400)]
        public async Task<IActionResult> DownloadImage(string id)
        {
            Logging.Instance.LogMessage($"Downloading image with ID {id}...");

            var etagValue = $"\"{id}\"";

            if (ResponseHelper.HasCachedVersion(this, etagValue))
            {
                return ResponseHelper.NotModified(this);
            }

            try
            {
                var imageModel = await _cacheManager.GetOrCreateImageAsync(id, () => _imagesCollectionService.Get(id));

                if (imageModel == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found.");
                    return ResponseHelper.NotFound(this, $"Image with ID {id} not found.");
                }

                var memoryStream = await _dropboxService.GetStreamForImage(id);

                if (memoryStream == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found on storage.");
                    return ResponseHelper.NotFound(this, $"Image with ID {id} not found on storage.");
                }

                Response.RegisterForDispose(memoryStream);

                using var skImage = SKImage.FromEncodedData(memoryStream);
                if (skImage == null)
                {
                    Logging.Instance.LogWarning("Invalid image file.");
                    return ResponseHelper.BadRequest(this, "Invalid image file.");
                }

                memoryStream.Position = 0;

                ResponseHelper.AddCacheHeaders(this, maxAge: 86400, etagValue);

                return File(memoryStream, "application/octet-stream", imageModel.Name);
            }            
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return ResponseHelper.InternalServerError(this);
            }
        }
    }
}
