using Microsoft.AspNetCore.Mvc;
using SkiaSharp;
using ImagesAPI.Services;
using ImagesAPI.Models;

namespace ImagesAPI.Controllers
{
    /// <summary>
    /// Controller for managing image-related actions.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class ImagesController(IImagesCollectionService imagesCollectionService, IGoogleService googleService) : ControllerBase
    {
        private readonly ImagesCollectionService _imagesCollectionService = (ImagesCollectionService)(imagesCollectionService ?? throw new ArgumentNullException(nameof(imagesCollectionService)));
        private readonly GoogleService _googleService = (GoogleService)(googleService ?? throw new ArgumentNullException(nameof(googleService)));

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
            try
            {
                List<ImageModel> images = await _imagesCollectionService.GetAll();

                if (images == null || images.Count == 0)
                    return NotFound();

                return Ok(images);
            }
            catch (Exception error)
            {
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
            try
            {
                var image = await _imagesCollectionService.Get(id);
                if (image == null)
                    return NotFound();
                return Ok(image);
            }
            catch (Exception error)
            {
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
            if (image == null || image.Length == 0)
                return BadRequest("No file uploaded.");

            if (!_allowedExtensions.Contains(Path.GetExtension(image.FileName)))
                return BadRequest("Invalid file type.");

            using var inputStream = image.OpenReadStream();
            using var skImage = SKImage.FromEncodedData(inputStream);

            if (skImage == null)
                return BadRequest("Invalid image file.");

            try
            {
                // Upload the image to Google Drive
                string imageId = await _googleService.UploadImage(image);

                if (string.IsNullOrWhiteSpace(imageId))
                {
                    return BadRequest("Error uploading the image.");
                }

                var imageModel = new ImageModel
                {
                    Id = imageId,
                    Name = image.FileName,
                    Width = skImage.Width,
                    Height = skImage.Height,
                    ContentType = image.ContentType,
                    Url = _googleService.GetImageURL(imageId, skImage.Width, skImage.Height)
                };

                // Insert the model into the database
                await _imagesCollectionService.Create(imageModel);

                return Ok(imageModel);
            }
            catch (Exception error)
            {
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
            if (string.IsNullOrWhiteSpace(filter) || !_allowedFilters.Contains(filter.ToLower()))
                return BadRequest("Invalid filter.");

            ImageModel newImage;
            try
            {
                newImage = await _imagesCollectionService.ApplyFilterToImage(id, filter, _googleService);
            }
            catch (ArgumentNullException error)
            {
                return BadRequest(error.Message);
            }
            catch (ArgumentException error)
            {
                return NotFound(error.Message);
            }
            catch (InvalidOperationException error)
            {
                return BadRequest(error.Message);
            }
            catch (Exception error)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, error.Message);
            }

            return Ok(newImage);
        }

        /// <summary>
        /// Deletes an image by its identifier, removing it from both the database and Google Drive.
        /// </summary>
        /// <param name="id">The identifier of the image to delete.</param>
        /// <returns>An IActionResult indicating the outcome of the operation.</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteImage(string id)
        {
            try
            {
                var image = await _imagesCollectionService.Get(id);

                if (image == null)
                    return NotFound();

                var deleteFromGoogleDrive = await _googleService.DeleteImage(id);

                if (deleteFromGoogleDrive == null)
                    return BadRequest("Error deleting the image.");

                if (!(await _imagesCollectionService.Delete(id)))
                    return BadRequest("Error deleting the image.");

                return Ok();
            }
            catch (Exception error)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, error.Message);
            }
        }
    }
}
