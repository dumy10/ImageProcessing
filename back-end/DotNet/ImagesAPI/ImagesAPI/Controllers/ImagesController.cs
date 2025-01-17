using Microsoft.AspNetCore.Mvc;
using SkiaSharp;
using ImagesAPI.Services;
using ImagesAPI.Models;
using ImagesAPI.Logger;

namespace ImagesAPI.Controllers
{
    /// <summary>
    /// Controller for managing image-related actions.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class ImagesController(IImagesCollectionService imagesCollectionService, IDropboxService dropboxService) : ControllerBase
    {
        private readonly ImagesCollectionService _imagesCollectionService = (ImagesCollectionService)(imagesCollectionService ?? throw new ArgumentNullException(nameof(imagesCollectionService)));
        private readonly DropboxService _dropboxService = (DropboxService)(dropboxService ?? throw new ArgumentNullException(nameof(dropboxService)));

        private static readonly HashSet<string> _allowedExtensions = [".jpeg", ".jpg", ".png"];
        private static readonly HashSet<string> _allowedFilters = ["grayscale", "invert", "blur", "sobel", "canny"];

        /// <summary>
        /// Retrieves all images.
        /// </summary>
        /// <returns>A list of all image models.</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetImages()
        {
            Logging.Instance.LogMessage("Retrieving all images...");
            try
            {
                List<ImageModel> images = await _imagesCollectionService.GetAll();

                if (images == null || images.Count == 0)
                {
                    Logging.Instance.LogWarning("No images found.");
                    return NotFound();
                }

                Logging.Instance.LogMessage("Images retrieved successfully.");
                return Ok(images);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, error.Message);
            }
        }

        /// <summary>
        /// Retrieves an image by its identifier.
        /// </summary>
        /// <param name="id">The identifier of the image.</param>
        /// <returns>The image model if found; otherwise, a 404 response.</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetImage(string id)
        {
            Logging.Instance.LogMessage($"Retrieving image with ID {id}...");
            try
            {
                var image = await _imagesCollectionService.Get(id);
                if (image == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found.");
                    return NotFound();
                }

                Logging.Instance.LogMessage($"Image with ID {id} retrieved successfully.");

                return Ok(image);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, error.Message);
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
        public async Task<IActionResult> UploadImage(IFormFile image)
        {
            Logging.Instance.LogMessage("Uploading image...");
            if (image == null || image.Length == 0)
            {
                Logging.Instance.LogWarning("No file uploaded.");
                return BadRequest("No file uploaded.");
            }

            if (!_allowedExtensions.Contains(Path.GetExtension(image.FileName)))
            {
                Logging.Instance.LogWarning("Invalid file type.");
                return BadRequest("Invalid file type.");
            }

            using var inputStream = image.OpenReadStream();
            using var skImage = SKImage.FromEncodedData(inputStream);

            if (skImage == null)
            {
                Logging.Instance.LogWarning("Invalid image file.");
                return BadRequest("Invalid image file.");
            }

            try
            {
                // Upload the image to the drive 
                string imageId = await _dropboxService.UploadImage(image);

                if (string.IsNullOrWhiteSpace(imageId))
                {
                    Logging.Instance.LogError("Error uploading the image.");
                    return BadRequest("Error uploading the image.");
                }

                var imageModel = new ImageModel
                {
                    Id = imageId,
                    Name = image.FileName,
                    Width = skImage.Width,
                    Height = skImage.Height,
                    ContentType = image.ContentType,
                    Url = await _dropboxService.GetImageURL(imageId)
                };

                // Insert the model into the database
                await _imagesCollectionService.Create(imageModel);

                Logging.Instance.LogMessage("Image uploaded successfully.");

                return Ok(imageModel);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, error.Message);
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
        public async Task<IActionResult> EditImage(string id, [FromBody] string filter)
        {
            Logging.Instance.LogMessage($"Applying filter {filter} to image with ID {id}...");
            if (string.IsNullOrWhiteSpace(filter) || !_allowedFilters.Contains(filter.ToLower()))
            {
                Logging.Instance.LogWarning("Invalid filter.");
                return BadRequest("Invalid filter.");
            }

            ImageModel newImage;
            try
            {
                newImage = await _imagesCollectionService.ApplyFilterToImage(id, filter, _dropboxService);
                Logging.Instance.LogMessage($"Filter {filter} applied successfully to image with ID {id}.");
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
                return StatusCode(StatusCodes.Status500InternalServerError, error.Message);
            }

            return Ok(newImage);
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
        public async Task<IActionResult> DeleteImage(string id)
        {
            Logging.Instance.LogMessage($"Deleting image with ID {id}...");
            try
            {
                var image = await _imagesCollectionService.Get(id);

                if (image == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found.");
                    return NotFound();
                }

                var deleteFromDropbox = await _dropboxService.DeleteImage(id);

                if (!deleteFromDropbox)
                {
                    Logging.Instance.LogError("Error deleting the image from drive.");
                    return BadRequest("Error deleting the image.");
                }

                if (!(await _imagesCollectionService.Delete(id)))
                {
                    Logging.Instance.LogError("Error deleting the image from the database.");
                    return BadRequest("Error deleting the image.");
                }

                Logging.Instance.LogMessage($"Image with ID {id} deleted successfully.");

                return Ok();
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, error.Message);
            }
        }

        /// <summary>
        /// Downloads an image by its identifier.
        /// </summary>
        /// <param name="id"></param>
        /// <returns>An IActionResult indicating the outcome of the operation.</returns>
        [HttpGet("download/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DownloadImage(string id)
        {
            Logging.Instance.LogMessage($"Downloading image with ID {id}...");
            try
            {
                var memoryStream = await _dropboxService.GetStreamForImage(id);

                if (memoryStream == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found.");
                    return NotFound();
                }

                using var skImage = SKImage.FromEncodedData(memoryStream);
                if (skImage == null)
                {
                    Logging.Instance.LogWarning("Invalid image file.");
                    return BadRequest("Invalid image file.");
                }

                var imageModel = await _imagesCollectionService.Get(id);

                if (imageModel == null)
                {
                    Logging.Instance.LogWarning($"Image with ID {id} not found.");
                    return NotFound();
                }

                memoryStream.Position = 0;

                return File(memoryStream, "application/octet-stream", imageModel.Name);
            }
            catch (Exception error)
            {
                Logging.Instance.LogError(error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, error.Message);
            }
        }
    }
}
