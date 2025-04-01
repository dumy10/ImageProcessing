using ImagesAPI.Logger;
using ImagesAPI.Models;
using ImagesAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using SkiaSharp;

namespace ImagesAPI.Controllers
{
    /// <summary>
    /// Controller for managing image-related actions.
    /// </summary>
    /// <remarks>
    /// Constructor for the ImagesController
    /// </remarks>
    /// <param name="imagesCollectionService">Service for image collection operations</param>
    /// <param name="dropboxService">Service for Dropbox operations</param>
    /// <param name="cacheService">Service for caching operations</param>
    [ApiController]
    [Route("[controller]")]
    [ResponseCache(VaryByHeader = "Accept, Accept-Encoding", Location = ResponseCacheLocation.Any)]
    public class ImagesController(IImagesCollectionService imagesCollectionService, IDropboxService dropboxService, ICacheService cacheService) : ControllerBase
    {
        private readonly IImagesCollectionService _imagesCollectionService = imagesCollectionService ?? throw new ArgumentNullException(nameof(imagesCollectionService));
        private readonly IDropboxService _dropboxService = dropboxService ?? throw new ArgumentNullException(nameof(dropboxService));
        private readonly ICacheService _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));

        private static readonly SemaphoreSlim _cacheSemaphore = new(1, 1);

        #region Cache Durations
        private const int CACHE_DURATION_SHORT = 5; // minutes
        private const int CACHE_DURATION_MEDIUM = 60; // minutes
        #endregion

        private const int MAX_IMAGE_SIZE = 1024 * 1024 * 10; // 10 MB

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
                // Try to get images from cache first using a more cache-friendly approach
                string cacheKey = "all_images";

                // Use GetOrCreateAsync to match test expectations
                List<ImageModel>? images = await _cacheService.GetOrCreateAsync<List<ImageModel>>(cacheKey, async () => await _imagesCollectionService.GetAll(), CACHE_DURATION_SHORT);

                if (images == null || images.Count == 0)
                {
                    Logging.Instance.LogWarning("No images found.");
                    return NotFound("No images found.");
                }

                // Add cache control headers 
                Response.Headers.Append("Cache-Control", "public, max-age=300");

                Logging.Instance.LogMessage("Images retrieved successfully.");
                return Ok(images);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError);
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
                // Use the id value as the ETag for fine-grained cache validation
                var etagValue = $"\"{id}\"";

                // Check if the client already has this version using ETag - avoid unnecessary processing
                var clientETag = Request.Headers.IfNoneMatch.FirstOrDefault();
                if (clientETag != null && clientETag == etagValue)
                {
                    return StatusCode(StatusCodes.Status304NotModified);
                }

                // Use GetOrCreateAsync to match test expectations
                string cacheKey = $"image_{id}";
                var image = await _cacheService.GetOrCreateAsync<ImageModel?>(cacheKey, async () => await _imagesCollectionService.Get(id), CACHE_DURATION_MEDIUM);

                if (image == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found.");
                    return NotFound($"Image with ID {id} not found.");
                }

                // Add cache control headers
                Response.Headers.Append("Cache-Control", "public, max-age=3600");
                Response.Headers.Append("ETag", etagValue);

                Logging.Instance.LogMessage($"Image with ID {id} retrieved successfully.");

                return Ok(image);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Uploads a new image to the server.
        /// </summary>
        /// <param name="image">The image file to upload.</param>
        /// <returns>The uploaded image model.</returns>
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [DisableRequestSizeLimit]
        [ResponseCache(NoStore = true)]
        public async Task<IActionResult> UploadImage(IFormFile? image)
        {
            Logging.Instance.LogMessage("Uploading image...");

            if (image == null || image.Length == 0)
            {
                Logging.Instance.LogWarning("No file uploaded.");
                return BadRequest("No file uploaded.");
            }

            if (image.Length > MAX_IMAGE_SIZE)
            {
                Logging.Instance.LogWarning("File size exceeds the limit.");
                return BadRequest("File size exceeds the limit.");
            }

            try
            {
                // Use a memory stream to avoid file locking and improve performance
                using var memoryStream = new MemoryStream();
                await image.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                // Validate the image format
                using var skData = SKData.Create(memoryStream);
                using var skCodec = SKCodec.Create(skData);
                if (skCodec == null)
                {
                    Logging.Instance.LogWarning("Invalid or corrupted image file.");
                    return BadRequest("Invalid or corrupted image file.");
                }

                // Get the image format and check if it's allowed
                var imageFormat = skCodec.EncodedFormat.ToString().ToUpper();
                if (!Enum.TryParse<EAllowedExtensions>(imageFormat, out _))
                {
                    Logging.Instance.LogWarning($"Invalid file type: {imageFormat}");
                    return BadRequest("Invalid file type. Please make sure the image was not altered. Allowed types: JPEG, JPG, PNG.");
                }

                memoryStream.Position = 0;
                using var skImage = SKImage.FromEncodedData(skData);
                if (skImage == null)
                {
                    Logging.Instance.LogWarning("Invalid image file.");
                    return BadRequest("Invalid image file.");
                }

                // Reset position for upload and get image dimensions once
                memoryStream.Position = 0;
                int width = skImage.Width;
                int height = skImage.Height;

                // Upload the image to the drive using a stream directly
                string imageId = await _dropboxService.UploadImage(image);

                if (string.IsNullOrWhiteSpace(imageId))
                {
                    Logging.Instance.LogError("Error uploading the image.");
                    return BadRequest("Error uploading the image.");
                }

                // Create the model with the data we've already extracted
                var imageModel = new ImageModel
                {
                    Id = imageId,
                    Name = image.FileName,
                    Width = width,
                    Height = height,
                    ContentType = image.ContentType,
                    Url = await _dropboxService.GetImageURL(imageId)
                };

                // Insert the model into the database
                await _imagesCollectionService.Create(imageModel);

                // Clear only necessary cache to ensure fresh data is returned
                await _cacheSemaphore.WaitAsync();
                try
                {
                    _cacheService.Remove("all_images");
                    _cacheService.Set($"image_{imageId}", imageModel, CACHE_DURATION_MEDIUM);
                }
                finally
                {
                    _cacheSemaphore.Release();
                }

                Logging.Instance.LogMessage("Image uploaded successfully.");
                return Ok(imageModel);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Applies a filter to an existing image.
        /// </summary>
        /// <param name="id">The identifier of the image to edit.</param>
        /// <param name="filter">The filter to apply to the image.</param>
        /// <returns>The modified image model.</returns>
        [HttpPut("edit/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ResponseCache(NoStore = true)]
        public async Task<IActionResult> EditImage(string id, [FromBody] string filter)
        {
            Logging.Instance.LogMessage($"Applying filter {filter} to image with ID {id}...");

            // We do not check for the size of the image here, as it's already uploaded and validated

            // Remove spaces and whitespace from the filter
            filter = filter.Replace(" ", string.Empty).ToLower();

            // Validate filter
            if (!Enum.TryParse<EAllowedFilters>(filter.ToUpper(), out _))
            {
                Logging.Instance.LogWarning($"Invalid filter: {filter}");
                return BadRequest($"The filter {filter} is not accepted. Please try again.");
            }

            // Use a compound cache key for this specific filter application
            string filterCacheKey = $"image_{id}_filter_{filter}";

            try
            {
                // Check if this filtered version already exists in cache
                if (_cacheService.TryGetValue<ImageModel>(filterCacheKey, out var cachedResult) && cachedResult != null)
                {
                    Logging.Instance.LogMessage($"Returning cached filtered image for ID {id} with filter {filter}");
                    return Ok(cachedResult);
                }

                // Apply the filter
                var newImage = await _imagesCollectionService.ApplyFilterToImage(id, filter, _dropboxService);

                if (newImage == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found or filter could not be applied.");
                    return NotFound($"Image with ID {id} not found.");
                }

                // Cache the result for this specific filter/image combination
                _cacheService.Set(filterCacheKey, newImage, CACHE_DURATION_MEDIUM);

                // Use SemaphoreSlim to safely update cache in a concurrent environment
                await _cacheSemaphore.WaitAsync();
                try
                {
                    // Clear exactly the keys the tests expect to be cleared
                    _cacheService.Remove("all_images");
                    _cacheService.Remove($"image_{id}");

                    // Also remove the new image's cache key to ensure fresh data
                    if (newImage.Id != id) // Only if it's different from original
                    {
                        _cacheService.Remove($"image_{newImage.Id}");
                    }

                    // Add the new filtered image to cache
                    _cacheService.Set($"image_{newImage.Id}", newImage, CACHE_DURATION_MEDIUM);
                }
                finally
                {
                    _cacheSemaphore.Release();
                }

                Logging.Instance.LogMessage($"Filter {filter} applied successfully to image with ID {id}.");
                return Ok(newImage);
            }
            catch (ArgumentNullException error)
            {
                Logging.Instance.LogError(error.Message);
                return BadRequest(error.Message);
            }
            catch (ArgumentException error)
            {
                Logging.Instance.LogWarning(error.Message);
                return NotFound(error.Message);
            }
            catch (InvalidOperationException error)
            {
                Logging.Instance.LogError(error.Message);
                return BadRequest(error.Message);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
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
                // Get the image from database 
                var image = await _imagesCollectionService.Get(id);

                if (image == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found.");
                    return NotFound($"Image with ID {id} not found.");
                }

                // Try to delete from storage first
                if (!(await _dropboxService.DeleteImage(id)))
                {
                    Logging.Instance.LogError("Error deleting the image from drive.");
                    return BadRequest("Error deleting the image from storage.");
                }

                // Then delete from database
                if (!(await _imagesCollectionService.Delete(id)))
                {
                    Logging.Instance.LogError("Error deleting the image from the database.");
                    return BadRequest("Image was deleted from storage but could not be removed from the database.");
                }

                // Clear necessary cache
                await _cacheSemaphore.WaitAsync();
                try
                {
                    _cacheService.Remove("all_images");
                    _cacheService.Remove($"image_{id}");
                }
                finally
                {
                    _cacheSemaphore.Release();
                }

                Logging.Instance.LogMessage($"Image with ID {id} deleted successfully.");
                return Ok();
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError);
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

            // Use the id as a strong ETag identifier 
            var etagValue = $"\"{id}\"";

            // Check if the client already has this version using ETag - this avoids unnecessary processing
            var clientETag = Request.Headers.IfNoneMatch.FirstOrDefault();
            if (clientETag != null && clientETag == etagValue)
            {
                return StatusCode(StatusCodes.Status304NotModified);
            }

            try
            {
                // Attempt to get the image model from cache first to get the name
                string cacheKey = $"image_{id}";
                var imageModel = await _cacheService.GetOrCreateAsync<ImageModel?>(cacheKey, async () => await _imagesCollectionService.Get(id), CACHE_DURATION_MEDIUM);

                if (imageModel == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found.");
                    return NotFound($"Image with ID {id} not found.");
                }

                var memoryStream = await _dropboxService.GetStreamForImage(id);

                if (memoryStream == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found on storage.");
                    return NotFound($"Image with ID {id} not found on storage.");
                }

                using var skImage = SKImage.FromEncodedData(memoryStream);
                if (skImage == null)
                {
                    Logging.Instance.LogWarning("Invalid image file.");
                    return BadRequest("Invalid image file.");
                }

                memoryStream.Position = 0;

                // Add strong caching for images with ETag support
                Response.Headers.Append("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
                Response.Headers.Append("ETag", etagValue);

                return File(memoryStream, "application/octet-stream", imageModel.Name);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }
    }
}
