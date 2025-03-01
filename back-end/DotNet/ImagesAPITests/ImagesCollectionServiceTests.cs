using ImagesAPI.Models;
using ImagesAPI.Services.Concretes;
using ImagesAPI.Services.Interfaces;
using ImagesAPI.Settings.Interfaces;
using MongoDB.Driver;
using Moq;
using SkiaSharp;

namespace ImagesAPITests
{
    public class ImagesCollectionServiceTests
    {
        private readonly Mock<IMongoCollection<ImageModel>> _mockCollection;
        private readonly Mock<IDriveService> _mockDriveService;
        private readonly ImagesCollectionService _service;

        public ImagesCollectionServiceTests()
        {
            _mockCollection = new Mock<IMongoCollection<ImageModel>>();
            _mockDriveService = new Mock<IDriveService>();
            var mockSettings = new Mock<IMongoDBSettings>();
            mockSettings.SetupGet(s => s.ConnectionString).Returns("mongodb://localhost:27017");
            mockSettings.SetupGet(s => s.DatabaseName).Returns("ImagesDB");
            mockSettings.SetupGet(s => s.ImagesCollectionName).Returns("Images");

            _service = new ImagesCollectionService(mockSettings.Object, _mockCollection.Object);
        }

        [Fact]
        public async Task Create_ShouldAssignNewGuid_WhenIdIsNullOrWhitespace()
        {
            // Arrange
            var model = new ImageModel { Id = null };

            // Act
            var result = await _service.Create(model);

            // Assert
            Assert.False(string.IsNullOrWhiteSpace(model.Id));
            Assert.True(result);
            _mockCollection.Verify(c => c.InsertOneAsync(model, null, default), Times.Once);
        }

        [Fact]
        public async Task Create_ShouldNotChangeId_WhenIdIsNotNullOrWhitespace()
        {
            // Arrange
            var model = new ImageModel { Id = "existing-id" };

            // Act
            var result = await _service.Create(model);

            // Assert
            Assert.Equal("existing-id", model.Id);
            Assert.True(result);
            _mockCollection.Verify(c => c.InsertOneAsync(model, null, default), Times.Once);
        }

        [Fact]
        public async Task Delete_ShouldReturnTrue_WhenDeletionIsAcknowledgedAndDeletedCountIsGreaterThanZero()
        {
            // Arrange
            var id = "existing-id";
            var deleteResult = new DeleteResult.Acknowledged(1);
            _mockCollection.Setup(c => c.DeleteOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), default))
                           .ReturnsAsync(deleteResult);

            // Act
            var result = await _service.Delete(id);

            // Assert
            Assert.True(result);
            _mockCollection.Verify(c => c.DeleteOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), default), Times.Once);
        }

        [Fact]
        public async Task Delete_ShouldReturnFalse_WhenDeletionIsNotAcknowledged()
        {
            // Arrange
            var id = "non-existing-id";
            var deleteResult = DeleteResult.Unacknowledged.Instance;
            _mockCollection.Setup(c => c.DeleteOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), default))
                           .ReturnsAsync(deleteResult);

            // Act
            var result = await _service.Delete(id);

            // Assert
            Assert.False(result);
            _mockCollection.Verify(c => c.DeleteOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), default), Times.Once);
        }

        [Fact]
        public async Task Delete_ShouldReturnFalse_WhenDeletedCountIsZero()
        {
            // Arrange
            var id = "non-existing-id";
            var deleteResult = new DeleteResult.Acknowledged(0);
            _mockCollection.Setup(c => c.DeleteOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), default))
                           .ReturnsAsync(deleteResult);

            // Act
            var result = await _service.Delete(id);

            // Assert
            Assert.False(result);
            _mockCollection.Verify(c => c.DeleteOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), default), Times.Once);
        }

        [Fact]
        public async Task Get_ShouldReturnImage_WhenImageExists()
        {
            // Arrange
            var id = "existing-id";
            var expectedImage = new ImageModel { Id = id };
            var mockCursor = new Mock<IAsyncCursor<ImageModel>>();
            mockCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockCursor.Setup(c => c.Current).Returns(new List<ImageModel> { expectedImage });

            _mockCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ImageModel>>(), It.IsAny<FindOptions<ImageModel, ImageModel>>(), It.IsAny<CancellationToken>()))
                           .ReturnsAsync(mockCursor.Object);

            // Act
            var result = await _service.Get(id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(id, result?.Id);
        }

        [Fact]
        public async Task Get_ShouldReturnNull_WhenImageDoesNotExist()
        {
            // Arrange
            var id = "non-existing-id";
            var mockCursor = new Mock<IAsyncCursor<ImageModel>>();
            mockCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(false);
            mockCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);

            _mockCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ImageModel>>(), It.IsAny<FindOptions<ImageModel, ImageModel>>(), It.IsAny<CancellationToken>()))
                           .ReturnsAsync(mockCursor.Object);

            // Act
            var result = await _service.Get(id);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetAll_ShouldReturnAllImages()
        {
            // Arrange
            var expectedImages = new List<ImageModel>
            {
                new() { Id = "id1" },
                new() { Id = "id2" }
            };
            var mockCursor = new Mock<IAsyncCursor<ImageModel>>();
            mockCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockCursor.Setup(c => c.Current).Returns(expectedImages);

            _mockCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ImageModel>>(), It.IsAny<FindOptions<ImageModel, ImageModel>>(), It.IsAny<CancellationToken>()))
                           .ReturnsAsync(mockCursor.Object);

            // Act
            var result = await _service.GetAll();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedImages.Count, result.Count);
            Assert.Equal(expectedImages[0].Id, result[0].Id);
            Assert.Equal(expectedImages[1].Id, result[1].Id);
        }

        [Fact]
        public async Task Update_ShouldReturnTrue_WhenUpdateIsAcknowledgedAndModifiedCountIsGreaterThanZero()
        {
            // Arrange
            var id = "existing-id";
            var model = new ImageModel { Id = id };
            var updateResult = new ReplaceOneResult.Acknowledged(1, 1, id);
            _mockCollection.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), model, It.IsAny<ReplaceOptions>(), default))
                           .ReturnsAsync(updateResult);

            // Act
            var result = await _service.Update(id, model);

            // Assert
            Assert.True(result);
            _mockCollection.Verify(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), model, It.IsAny<ReplaceOptions>(), default), Times.Once);
            _mockCollection.Verify(c => c.InsertOneAsync(It.IsAny<ImageModel>(), null, default), Times.Never);
        }

        [Fact]
        public async Task Update_ShouldReturnFalse_WhenUpdateIsAcknowledgedButModifiedCountIsZero()
        {
            // Arrange
            var id = "existing-id";
            var model = new ImageModel { Id = id };
            var updateResult = new ReplaceOneResult.Acknowledged(0, 0, id);
            _mockCollection.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), model, It.IsAny<ReplaceOptions>(), default))
                           .ReturnsAsync(updateResult);

            // Act
            var result = await _service.Update(id, model);

            // Assert
            Assert.False(result);
            _mockCollection.Verify(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), model, It.IsAny<ReplaceOptions>(), default), Times.Once);
            _mockCollection.Verify(c => c.InsertOneAsync(model, null, default), Times.Once);
        }

        [Fact]
        public async Task Update_ShouldReturnFalse_WhenUpdateIsNotAcknowledged()
        {
            // Arrange
            var id = "existing-id";
            var model = new ImageModel { Id = id };
            var updateResult = ReplaceOneResult.Unacknowledged.Instance;
            _mockCollection.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), model, It.IsAny<ReplaceOptions>(), default))
                           .ReturnsAsync(updateResult);

            // Act
            var result = await _service.Update(id, model);

            // Assert
            Assert.False(result);
            _mockCollection.Verify(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<ImageModel>>(), model, It.IsAny<ReplaceOptions>(), default), Times.Once);
            _mockCollection.Verify(c => c.InsertOneAsync(model, null, default), Times.Once);
        }

        [Fact]
        public async Task ApplyFilterToImage_ShouldThrowArgumentException_WhenImageDoesNotExist()
        {
            // Arrange
            var id = "non-existing-id";
            var filter = "grayscale";
            _mockCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ImageModel>>(), It.IsAny<FindOptions<ImageModel, ImageModel>>(), It.IsAny<CancellationToken>()))
                           .ReturnsAsync(Mock.Of<IAsyncCursor<ImageModel>>());

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => _service.ApplyFilterToImage(id, filter, _mockDriveService.Object));
        }

        [Fact]
        public async Task ApplyFilterToImage_ShouldThrowArgumentException_WhenImageFormatIsInvalid()
        {
            // Arrange
            var id = "existing-id";
            var filter = "grayscale";
            var imageModel = new ImageModel { Id = id };
            var mockCursor = new Mock<IAsyncCursor<ImageModel>>();
            mockCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockCursor.Setup(c => c.Current).Returns([imageModel]);

            _mockCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ImageModel>>(), It.IsAny<FindOptions<ImageModel, ImageModel>>(), It.IsAny<CancellationToken>()))
                           .ReturnsAsync(mockCursor.Object);

            var memoryStream = new MemoryStream();
            _mockDriveService.Setup(d => d.GetStreamForImage(id)).ReturnsAsync(memoryStream);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => _service.ApplyFilterToImage(id, filter, _mockDriveService.Object));
        }

        [Fact]
        public async Task ApplyFilterToImage_ShouldReturnModifiedImageModel_WhenFilterIsSuccessfullyApplied()
        {
            // Arrange
            var id = "existing-id";
            var filter = "grayscale";
            var imageModel = new ImageModel { Id = id, Name = "test.jpg", ContentType = "image/jpeg" };
            var mockCursor = new Mock<IAsyncCursor<ImageModel>>();
            mockCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockCursor.Setup(c => c.Current).Returns([imageModel]);

            _mockCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ImageModel>>(), It.IsAny<FindOptions<ImageModel, ImageModel>>(), It.IsAny<CancellationToken>()))
                           .ReturnsAsync(mockCursor.Object);

            var memoryStream = new MemoryStream();
            // Write valid image data to the memory stream
            using (var bitmap = new SKBitmap(100, 100))
            {
                using (var canvas = new SKCanvas(bitmap))
                {
                    canvas.Clear(SKColors.White);
                }
                using var image = SKImage.FromBitmap(bitmap);
                using var data = image.Encode(SKEncodedImageFormat.Jpeg, 100);
                data.SaveTo(memoryStream);
            }
            memoryStream.Position = 0;

            _mockDriveService.Setup(d => d.GetStreamForImage(id)).ReturnsAsync(memoryStream);
            _mockDriveService.Setup(d => d.UploadImage(It.IsAny<MemoryStream>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync("modified-id");
            _mockDriveService.Setup(d => d.GetImageURL("modified-id")).ReturnsAsync("http://example.com/modified.jpg");

            // Act
            var result = await _service.ApplyFilterToImage(id, filter, _mockDriveService.Object);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("modified-id", result?.Id);
            Assert.Equal("http://example.com/modified.jpg", result?.Url);
            Assert.NotNull(result?.AppliedFilters);
            Assert.Contains(filter, result.AppliedFilters);
        }
    }
}