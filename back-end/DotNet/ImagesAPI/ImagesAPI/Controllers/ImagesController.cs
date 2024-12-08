using Microsoft.AspNetCore.Mvc;
using SkiaSharp;
using ImagesAPI.Services;
using ImagesAPI.Models;

namespace ImagesAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ImagesController(IImagesCollectionService imagesCollectionService, IGoogleService googleService) : ControllerBase
    {
        private readonly IImagesCollectionService _imagesCollectionService = imagesCollectionService ?? throw new ArgumentNullException(nameof(imagesCollectionService));
        private readonly IGoogleService _googleService = googleService ?? throw new ArgumentNullException(nameof(googleService));

        private static readonly List<string> _allowedExtensions = [".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg+xml"];
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetImages()
        {
            List<ImageModel> images = await _imagesCollectionService.GetAll();

            if (images == null || images.Count == 0)
                return NotFound();

            return Ok(images);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetImage(string id)
        {
            var image = await _imagesCollectionService.Get(id);

            if (image == null)
                return NotFound();

            return Ok(image);
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UploadImage(IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest("No file uploaded.");

            if (!_allowedExtensions.Contains(Path.GetExtension(image.FileName)))
                return BadRequest("Invalid file type.");

            // Upload the image to google drive
            string imageId = await _googleService.UploadImage(image);

            if (string.IsNullOrWhiteSpace(imageId))
            {
                return BadRequest("Error uploading the image.");
            }

            using var inputStream = image.OpenReadStream();
            using var skImage = SKImage.FromEncodedData(inputStream);

            if (skImage == null)
                return BadRequest("Invalid image file.");

            var imageModel = new ImageModel
            {
                Id = imageId,
                Name = image.FileName,
                Width = skImage.Width,
                Height = skImage.Height,
                ContentType = image.ContentType,
                Url = _googleService.GetImageURL(imageId, skImage.Width, skImage.Height)
            };

            // Insert the model in the DB
            await _imagesCollectionService.Create(imageModel);

            return Ok(imageModel);
        }

        [HttpPut("edit/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> EditImage(string id, [FromBody] string filter)
        {
            ImageModel newImage;
            try
            {
                newImage = await _imagesCollectionService.ApplyFilterToImage(id, filter, googleService);
            }
            catch (ArgumentNullException error)
            {
                return BadRequest(error.Message);
            }
            catch (ArgumentException error)
            {
                return NotFound(error.Message);
            }

            return Ok(newImage);
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteImage(string id)
        {
            var image = await _imagesCollectionService.Get(id);

            if (image == null)
                return NotFound();

            await _imagesCollectionService.Delete(id);
            return Ok();
        }
    }
}
