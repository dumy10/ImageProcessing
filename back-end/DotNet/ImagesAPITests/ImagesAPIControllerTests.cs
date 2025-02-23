using ImagesAPI.Controllers;
using ImagesAPI.Models;
using ImagesAPI.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SkiaSharp;

namespace ImagesAPITests
{
    public class ImagesAPIControllerTests
    {
        private readonly Mock<IImagesCollectionService> _mockImagesCollectionService;
        private readonly Mock<IDropboxService> _mockDropboxService;
        private readonly ImagesController _controller;

        public ImagesAPIControllerTests()
        {
            _mockImagesCollectionService = new Mock<IImagesCollectionService>();
            _mockDropboxService = new Mock<IDropboxService>();
            _controller = new ImagesController(_mockImagesCollectionService.Object, _mockDropboxService.Object);
        }

        [Fact]
        public async Task GetImages_ReturnsOkResult_WithListOfImages()
        {
            // Arrange
            var images = new List<ImageModel> { new() { Id = "1", Name = "TestImage" } };
            _mockImagesCollectionService.Setup(service => service.GetAll()).ReturnsAsync(images);

            // Act
            var result = await _controller.GetImages();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<List<ImageModel>>(okResult.Value);
            Assert.Single(returnValue);
        }

        [Fact]
        public async Task GetImages_ReturnsNotFound_WhenNoImages()
        {
            // Arrange
            _mockImagesCollectionService.Setup(service => service.GetAll()).ReturnsAsync([]);

            // Act
            var result = await _controller.GetImages();

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task GetImage_ReturnsOkResult_WithImage()
        {
            // Arrange
            var image = new ImageModel { Id = "1", Name = "TestImage" };
            _mockImagesCollectionService.Setup(service => service.Get("1")).ReturnsAsync(image);

            // Act
            var result = await _controller.GetImage("1");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<ImageModel>(okResult.Value);
            Assert.Equal("1", returnValue.Id);
        }

        [Fact]
        public async Task GetImage_ReturnsNotFound_WhenImageNotFound()
        {
            // Arrange
            _mockImagesCollectionService.Setup(service => service.Get("1")).ReturnsAsync((ImageModel?)null);

            // Act
            var result = await _controller.GetImage("1");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task UploadImage_ReturnsOkResult_WithImageModel()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            var fileName = "test.png";
            var ms = new MemoryStream();

            // Create a valid PNG image and write it to the memory stream
            using var bitmap = new SKBitmap(100, 100);
            using var canvas = new SKCanvas(bitmap);
            canvas.Clear(SKColors.White);
            using var image = SKImage.FromBitmap(bitmap);
            using var data = image.Encode(SKEncodedImageFormat.Png, 100);
            data.SaveTo(ms);
            ms.Position = 0;

            fileMock.Setup(_ => _.OpenReadStream()).Returns(ms);
            fileMock.Setup(_ => _.FileName).Returns(fileName);
            fileMock.Setup(_ => _.Length).Returns(ms.Length);
            fileMock.Setup(_ => _.ContentType).Returns("image/png");

            _mockDropboxService.Setup(service => service.UploadImage(It.IsAny<IFormFile>())).ReturnsAsync("1");
            _mockDropboxService.Setup(service => service.GetImageURL("1")).ReturnsAsync("http://example.com/test.png");
            _mockImagesCollectionService.Setup(service => service.Create(It.IsAny<ImageModel>())).ReturnsAsync(true);

            // Act
            var result = await _controller.UploadImage(fileMock.Object);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<ImageModel>(okResult.Value);
            Assert.Equal("1", returnValue.Id);
        }

        [Fact]
        public async Task UploadImage_ReturnsBadRequest_WhenNoFileUploaded()
        {
            // Act
            var result = await _controller.UploadImage(null);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UploadImage_ReturnsBadRequest_WhenInvalidImageFormat()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            var fileName = "test.txt";
            var ms = new MemoryStream();
            var writer = new StreamWriter(ms);
            writer.Write("Invalid image content");
            writer.Flush();
            ms.Position = 0;

            fileMock.Setup(_ => _.OpenReadStream()).Returns(ms);
            fileMock.Setup(_ => _.FileName).Returns(fileName);
            fileMock.Setup(_ => _.Length).Returns(ms.Length);
            fileMock.Setup(_ => _.ContentType).Returns("text/plain");

            // Act
            var result = await _controller.UploadImage(fileMock.Object);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UploadImage_ReturnsBadRequest_WhenCorruptedImageFile()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            var fileName = "test.png";
            var ms = new MemoryStream();
            var writer = new StreamWriter(ms);
            writer.Write("Corrupted image content");
            writer.Flush();
            ms.Position = 0;

            fileMock.Setup(_ => _.OpenReadStream()).Returns(ms);
            fileMock.Setup(_ => _.FileName).Returns(fileName);
            fileMock.Setup(_ => _.Length).Returns(ms.Length);
            fileMock.Setup(_ => _.ContentType).Returns("image/png");

            // Act
            var result = await _controller.UploadImage(fileMock.Object);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UploadImage_ReturnsInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            var fileName = "test.png";
            var ms = new MemoryStream();

            // Create a valid PNG image and write it to the memory stream
            using var bitmap = new SKBitmap(100, 100);
            using var canvas = new SKCanvas(bitmap);
            canvas.Clear(SKColors.White);
            using var image = SKImage.FromBitmap(bitmap);
            using var data = image.Encode(SKEncodedImageFormat.Png, 100);
            data.SaveTo(ms);

            ms.Position = 0;

            fileMock.Setup(_ => _.OpenReadStream()).Returns(ms);
            fileMock.Setup(_ => _.FileName).Returns(fileName);
            fileMock.Setup(_ => _.Length).Returns(ms.Length);
            fileMock.Setup(_ => _.ContentType).Returns("image/png");

            _mockDropboxService.Setup(service => service.UploadImage(It.IsAny<IFormFile>())).ThrowsAsync(new Exception("Test exception"));

            // Act
            var result = await _controller.UploadImage(fileMock.Object);

            // Assert
            var statusCodeResult = Assert.IsType<StatusCodeResult>(result);
            Assert.Equal(StatusCodes.Status500InternalServerError, statusCodeResult.StatusCode);
        }

        [Fact]
        public async Task EditImage_ReturnsOkResult_WithModifiedImage()
        {
            // Arrange
            var image = new ImageModel { Id = "1", Name = "TestImage" };
            var filter = "grayscale";
            _mockImagesCollectionService.Setup(service => service.ApplyFilterToImage("1", filter, _mockDropboxService.Object)).ReturnsAsync(image);

            // Act
            var result = await _controller.EditImage("1", filter);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<ImageModel>(okResult.Value);
            Assert.Equal("1", returnValue.Id);
        }

        [Fact]
        public async Task EditImage_ReturnsBadRequest_WhenInvalidFilter()
        {
            // Act
            var result = await _controller.EditImage("1", "invalidfilter");

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task EditImage_ReturnsNotFound_WhenImageNotFound()
        {
            // Arrange
            var filter = "grayscale";
            _mockImagesCollectionService.Setup(service => service.ApplyFilterToImage("1", filter, _mockDropboxService.Object)).ReturnsAsync((ImageModel?)null);

            // Act
            var result = await _controller.EditImage("1", filter);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task EditImage_ReturnsInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            var filter = "grayscale";
            _mockImagesCollectionService.Setup(service => service.ApplyFilterToImage("1", filter, _mockDropboxService.Object)).ThrowsAsync(new Exception("Test exception"));

            // Act
            var result = await _controller.EditImage("1", filter);

            // Assert
            var statusCodeResult = Assert.IsType<StatusCodeResult>(result);
            Assert.Equal(StatusCodes.Status500InternalServerError, statusCodeResult.StatusCode);
        }

        [Fact]
        public async Task DeleteImage_ReturnsOkResult_WhenImageDeleted()
        {
            // Arrange
            var image = new ImageModel { Id = "1", Name = "TestImage" };
            _mockImagesCollectionService.Setup(service => service.Get("1")).ReturnsAsync(image);
            _mockDropboxService.Setup(service => service.DeleteImage("1")).ReturnsAsync(true);
            _mockImagesCollectionService.Setup(service => service.Delete("1")).ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteImage("1");

            // Assert
            Assert.IsType<OkResult>(result);
        }

        [Fact]
        public async Task DeleteImage_ReturnsNotFound_WhenImageNotFound()
        {
            // Arrange
            _mockImagesCollectionService.Setup(service => service.Get("1")).ReturnsAsync((ImageModel?)null);

            // Act
            var result = await _controller.DeleteImage("1");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task DeleteImage_ReturnsBadRequest_WhenDriveDeletionFails()
        {
            // Arrange
            var image = new ImageModel { Id = "1", Name = "TestImage" };
            _mockImagesCollectionService.Setup(service => service.Get("1")).ReturnsAsync(image);
            _mockDropboxService.Setup(service => service.DeleteImage("1")).ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteImage("1");

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task DeleteImage_ReturnsBadRequest_WhenDatabaseDeletionFails()
        {
            // Arrange
            var image = new ImageModel { Id = "1", Name = "TestImage" };
            _mockImagesCollectionService.Setup(service => service.Get("1")).ReturnsAsync(image);
            _mockDropboxService.Setup(service => service.DeleteImage("1")).ReturnsAsync(true);
            _mockImagesCollectionService.Setup(service => service.Delete("1")).ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteImage("1");

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task DeleteImage_ReturnsInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            var image = new ImageModel { Id = "1", Name = "TestImage" };
            _mockImagesCollectionService.Setup(service => service.Get("1")).ReturnsAsync(image);
            _mockDropboxService.Setup(service => service.DeleteImage("1")).ReturnsAsync(true);
            _mockImagesCollectionService.Setup(service => service.Delete("1")).ThrowsAsync(new Exception("Test exception"));

            // Act
            var result = await _controller.DeleteImage("1");

            // Assert
            var statusCodeResult = Assert.IsType<StatusCodeResult>(result);
            Assert.Equal(StatusCodes.Status500InternalServerError, statusCodeResult.StatusCode);
        }

        [Fact]
        public async Task DownloadImage_ReturnsFileResult_WithImage()
        {
            // Arrange
            var image = new ImageModel { Id = "1", Name = "TestImage.png" };
            var ms = new MemoryStream();

            // Create a valid PNG image and write it to the memory stream
            using var bitmap = new SKBitmap(100, 100);
            using var canvas = new SKCanvas(bitmap);
            canvas.Clear(SKColors.White);
            using var skImage = SKImage.FromBitmap(bitmap);
            using var data = skImage.Encode(SKEncodedImageFormat.Png, 100);
            data.SaveTo(ms);
            ms.Position = 0;

            _mockDropboxService.Setup(service => service.GetStreamForImage("1")).ReturnsAsync(ms);
            _mockImagesCollectionService.Setup(service => service.Get("1")).ReturnsAsync(image);

            // Act
            var result = await _controller.DownloadImage("1");

            // Assert
            var fileResult = Assert.IsType<FileStreamResult>(result);
            Assert.Equal("application/octet-stream", fileResult.ContentType);
            Assert.Equal("TestImage.png", fileResult.FileDownloadName);
        }

        [Fact]
        public async Task DownloadImage_ReturnsNotFound_WhenImageNotFound()
        {
            // Arrange
            _mockDropboxService.Setup(service => service.GetStreamForImage("1")).ReturnsAsync((MemoryStream?)null);

            // Act
            var result = await _controller.DownloadImage("1");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task DownloadImage_ReturnsBadRequest_WhenInvalidImageFile()
        {
            // Arrange
            var image = new ImageModel { Id = "1", Name = "TestImage.png" };
            var ms = new MemoryStream();
            var writer = new StreamWriter(ms);
            writer.Write("Corrupted image content");
            writer.Flush();
            ms.Position = 0;

            _mockDropboxService.Setup(service => service.GetStreamForImage("1")).ReturnsAsync(ms);
            _mockImagesCollectionService.Setup(service => service.Get("1")).ReturnsAsync(image);

            // Act
            var result = await _controller.DownloadImage("1");

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task DownloadImage_ReturnsInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            _mockDropboxService.Setup(service => service.GetStreamForImage("1")).ThrowsAsync(new Exception("Test exception"));

            // Act
            var result = await _controller.DownloadImage("1");

            // Assert
            var statusCodeResult = Assert.IsType<StatusCodeResult>(result);
            Assert.Equal(StatusCodes.Status500InternalServerError, statusCodeResult.StatusCode);
        }

        [Fact]
        public async Task DownloadImage_ReturnsNotFound_WhenImageMetadataNotFound()
        {
            // Arrange
            var ms = new MemoryStream();

            // Create a valid PNG image and write it to the memory stream
            using var bitmap = new SKBitmap(100, 100);
            using var canvas = new SKCanvas(bitmap);
            canvas.Clear(SKColors.White);
            using var skImage = SKImage.FromBitmap(bitmap);
            using var data = skImage.Encode(SKEncodedImageFormat.Png, 100);
            data.SaveTo(ms);
            ms.Position = 0;

            _mockDropboxService.Setup(service => service.GetStreamForImage("1")).ReturnsAsync(ms);
            _mockImagesCollectionService.Setup(service => service.Get("1")).ReturnsAsync((ImageModel?)null);

            // Act
            var result = await _controller.DownloadImage("1");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
