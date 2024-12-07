using Microsoft.AspNetCore.Mvc;
using SkiaSharp;
using ImagesAPI.Services;
using ImagesAPI.Models;

namespace ImagesAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ImagesController(IImagesCollectionService imagesCollectionService) : ControllerBase
    {
        private readonly IImagesCollectionService _imagesCollectionService = imagesCollectionService ?? throw new ArgumentNullException(nameof(imagesCollectionService));
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

            using var inputStream = image.OpenReadStream();
            using var skImage = SKImage.FromEncodedData(inputStream);

            if (skImage == null)
                return BadRequest("Invalid image file.");

            // The image is valid, it needs to be uploaded into the drive or on imgur and the database
            var id = Guid.NewGuid().ToString();

            var imageModel = new ImageModel
            {
                Id = id,
                Name = image.FileName,
                Width = skImage.Width,
                Height = skImage.Height,
            };

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
                newImage = await _imagesCollectionService.ApplyFilterToImage(id, filter);
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
