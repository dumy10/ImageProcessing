using ImagesAPI.Controllers;
using ImagesAPI.Helpers;
using ImagesAPI.Models;
using ImagesAPI.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace ImagesAPITests
{
    public class UsersControllerTests
    {
        private readonly Mock<IUserService> _mockUserService;
        private readonly UsersController _controller;
        private readonly Mock<HttpContext> _mockHttpContext;
        private readonly Mock<HttpRequest> _mockHttpRequest;
        private readonly Mock<HttpResponse> _mockHttpResponse;
        private readonly HeaderDictionary _requestHeaders;
        private readonly HeaderDictionary _responseHeaders;

        public UsersControllerTests()
        {
            _mockUserService = new Mock<IUserService>();

            // Setup mock HTTP context for auth handling
            _mockHttpContext = new Mock<HttpContext>();
            _mockHttpRequest = new Mock<HttpRequest>();
            _mockHttpResponse = new Mock<HttpResponse>();

            _requestHeaders = [];
            _responseHeaders = [];

            _mockHttpRequest.Setup(r => r.Headers).Returns(_requestHeaders);
            _mockHttpResponse.Setup(r => r.Headers).Returns(_responseHeaders);

            _mockHttpContext.Setup(c => c.Request).Returns(_mockHttpRequest.Object);
            _mockHttpContext.Setup(c => c.Response).Returns(_mockHttpResponse.Object);

            _controller = new UsersController(_mockUserService.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = _mockHttpContext.Object
                }
            };
        }

        #region GetUsers Tests

        [Fact]
        public async Task GetUsers_ReturnsOkResult_WithUsersList_WhenUserIsAdmin()
        {
            // Arrange
            var users = new List<UserModel> {
                new() { Id = "1", Name = "Admin User" },
                new() { Id = "2", Name = "Regular User" }
            };
            _mockUserService.Setup(service => service.GetAll()).ReturnsAsync(users);

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.GetUsers();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<List<UserModel>>(okResult.Value);
            Assert.Equal(2, returnValue.Count);
        }

        [Fact]
        public async Task GetUsers_ReturnsForbidden_WhenUserIsNotAdmin()
        {
            // Arrange
            // Setup non-admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "2", Name = "Regular User" } }
            });

            // Act
            var result = await _controller.GetUsers();

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task GetUsers_ReturnsInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            _mockUserService.Setup(service => service.GetAll()).ThrowsAsync(new Exception("Test exception"));

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.GetUsers();

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
        }

        #endregion

        #region GetUser Tests

        [Fact]
        public async Task GetUser_ReturnsOkResult_WithUser_WhenUserExists()
        {
            // Arrange
            var user = new UserModel { Id = "1", Name = "Test User" };
            _mockUserService.Setup(service => service.Get("1")).ReturnsAsync(user);

            // Act
            var result = await _controller.GetUser("1");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<UserModel>(okResult.Value);
            Assert.Equal("1", returnValue.Id);
            Assert.Equal("Test User", returnValue.Name);
        }

        [Fact]
        public async Task GetUser_ReturnsNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            _mockUserService.Setup(service => service.Get("1")).ReturnsAsync((UserModel?)null);

            // Act
            var result = await _controller.GetUser("1");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task GetUser_ReturnsInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            _mockUserService.Setup(service => service.Get("1")).ThrowsAsync(new Exception("Test exception"));

            // Act
            var result = await _controller.GetUser("1");

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
        }

        #endregion

        #region CreateUser Tests

        [Fact]
        public async Task CreateUser_ReturnsCreatedResult_WithUser_WhenDataIsValid()
        {
            // Arrange
            var createUserDto = new CreateUserDTO { Name = "New User", RateLimit = 60 };
            var newUser = new UserModel { Id = "new-id", Name = "New User", RateLimit = 60, ApiKey = "new-api-key" };

            _mockUserService.Setup(service => service.GetAll()).ReturnsAsync(new List<UserModel>());
            _mockUserService.Setup(service => service.GenerateApiKey()).Returns("new-api-key");
            _mockUserService.Setup(service => service.Create(It.IsAny<UserModel>())).ReturnsAsync(true);

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.CreateUser(createUserDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            var returnValue = Assert.IsType<UserModel>(createdResult.Value);
            Assert.Equal("New User", returnValue.Name);
            Assert.Equal(60, returnValue.RateLimit);
            Assert.NotEmpty(returnValue.Id);
            Assert.NotEmpty(returnValue.ApiKey);
        }

        [Fact]
        public async Task CreateUser_ReturnsBadRequest_WhenDtoIsNull()
        {
            // Arrange
            CreateUserDTO? createUserDto = null;

            // Act
            var result = await _controller.CreateUser(createUserDto);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task CreateUser_ReturnsForbidden_WhenUserIsNotAdmin()
        {
            // Arrange
            var createUserDto = new CreateUserDTO { Name = "New User", RateLimit = 60 };

            // Setup non-admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "2", Name = "Regular User" } }
            });

            // Act
            var result = await _controller.CreateUser(createUserDto);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task CreateUser_ReturnsConflict_WhenUserNameAlreadyExists()
        {
            // Arrange
            var createUserDto = new CreateUserDTO { Name = "Existing User", RateLimit = 60 };
            var existingUsers = new List<UserModel> { new() { Id = "3", Name = "Existing User" } };

            _mockUserService.Setup(service => service.GetAll()).ReturnsAsync(existingUsers);

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.CreateUser(createUserDto);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status409Conflict, objectResult.StatusCode);
        }

        [Fact]
        public async Task CreateUser_ReturnsInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            var createUserDto = new CreateUserDTO { Name = "New User", RateLimit = 60 };

            _mockUserService.Setup(service => service.GetAll()).ReturnsAsync(new List<UserModel>());
            _mockUserService.Setup(service => service.Create(It.IsAny<UserModel>())).ThrowsAsync(new Exception("Test exception"));

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.CreateUser(createUserDto);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
        }

        #endregion

        #region UpdateUser Tests

        [Fact]
        public async Task UpdateUser_ReturnsNoContent_WhenUpdateIsSuccessful_AsAdmin()
        {
            // Arrange
            var userId = "2";
            var updateUserDto = new UpdateUserDTO { Name = "Updated User", RateLimit = 100 };
            var existingUser = new UserModel { Id = userId, Name = "Test User", RateLimit = 60 };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);
            _mockUserService.Setup(service => service.GetAll()).ReturnsAsync(new List<UserModel> { existingUser });
            _mockUserService.Setup(service => service.Update(userId, It.IsAny<UserModel>())).ReturnsAsync(true);

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.UpdateUser(userId, updateUserDto);

            // Assert
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateUser_ReturnsNoContent_WhenUserUpdatesOwnData()
        {
            // Arrange
            var userId = "2";
            var updateUserDto = new UpdateUserDTO { Name = "Updated User", RateLimit = 100 };
            var existingUser = new UserModel { Id = userId, Name = "Test User", RateLimit = 60 };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);
            _mockUserService.Setup(service => service.GetAll()).ReturnsAsync(new List<UserModel> { existingUser });
            _mockUserService.Setup(service => service.Update(userId, It.IsAny<UserModel>())).ReturnsAsync(true);

            // Setup same user in HttpContext (updating own data)
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = userId, Name = "Test User" } }
            });

            // Act
            var result = await _controller.UpdateUser(userId, updateUserDto);

            // Assert
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateUser_ReturnsBadRequest_WhenDtoIsNull()
        {
            // Arrange
            UpdateUserDTO? updateUserDto = null;

            // Act
            var result = await _controller.UpdateUser("1", updateUserDto);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UpdateUser_ReturnsNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            var userId = "nonexistent";
            var updateUserDto = new UpdateUserDTO { Name = "Updated User", RateLimit = 100 };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync((UserModel?)null);

            // Act
            var result = await _controller.UpdateUser(userId, updateUserDto);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task UpdateUser_ReturnsForbidden_WhenNonAdminTriesToUpdateOtherUser()
        {
            // Arrange
            var userId = "2";
            var updateUserDto = new UpdateUserDTO { Name = "Updated User", RateLimit = 100 };
            var existingUser = new UserModel { Id = userId, Name = "Test User", RateLimit = 60 };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);

            // Setup different non-admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "3", Name = "Different User" } }
            });

            // Act
            var result = await _controller.UpdateUser(userId, updateUserDto);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task UpdateUser_ReturnsForbidden_WhenNonAdminTriesToSetNameToAdminUser()
        {
            // Arrange
            var userId = "2";
            var updateUserDto = new UpdateUserDTO { Name = AuthHelper.ADMIN_USER_NAME, RateLimit = 100 };
            var existingUser = new UserModel { Id = userId, Name = "Test User", RateLimit = 60 };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);

            // Setup same user in HttpContext (updating own data)
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = userId, Name = "Test User" } }
            });

            // Act
            var result = await _controller.UpdateUser(userId, updateUserDto);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task UpdateUser_ReturnsConflict_WhenNewNameAlreadyExists()
        {
            // Arrange
            var userId = "2";
            var updateUserDto = new UpdateUserDTO { Name = "Existing User", RateLimit = 100 };
            var existingUser = new UserModel { Id = userId, Name = "Test User", RateLimit = 60 };
            var otherExistingUser = new UserModel { Id = "3", Name = "Existing User", RateLimit = 60 };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);
            _mockUserService.Setup(service => service.GetAll()).ReturnsAsync(new List<UserModel> { existingUser, otherExistingUser });

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.UpdateUser(userId, updateUserDto);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status409Conflict, objectResult.StatusCode);
        }

        [Fact]
        public async Task UpdateUser_ReturnsInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            var userId = "2";
            var updateUserDto = new UpdateUserDTO { Name = "Updated User", RateLimit = 100 };
            var existingUser = new UserModel { Id = userId, Name = "Test User", RateLimit = 60 };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);
            _mockUserService.Setup(service => service.GetAll()).ReturnsAsync(new List<UserModel> { existingUser });
            _mockUserService.Setup(service => service.Update(userId, It.IsAny<UserModel>())).ThrowsAsync(new Exception("Test exception"));

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.UpdateUser(userId, updateUserDto);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
        }

        #endregion

        #region DeleteUser Tests

        [Fact]
        public async Task DeleteUser_ReturnsNoContent_WhenDeleteIsSuccessful()
        {
            // Arrange
            var userId = "2";
            var existingUser = new UserModel { Id = userId, Name = "Test User" };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);
            _mockUserService.Setup(service => service.Delete(userId)).ReturnsAsync(true);

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteUser_ReturnsNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            var userId = "nonexistent";

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync((UserModel?)null);

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task DeleteUser_ReturnsForbidden_WhenUserIsNotAdmin()
        {
            // Arrange
            var userId = "2";
            var existingUser = new UserModel { Id = userId, Name = "Test User" };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);

            // Setup non-admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "3", Name = "Regular User" } }
            });

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task DeleteUser_ReturnsInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            var userId = "2";
            var existingUser = new UserModel { Id = userId, Name = "Test User" };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);
            _mockUserService.Setup(service => service.Delete(userId)).ThrowsAsync(new Exception("Test exception"));

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
        }

        #endregion

        #region RegenerateApiKey Tests

        [Fact]
        public async Task RegenerateApiKey_ReturnsOkResult_WithNewApiKey_WhenUserUpdatesSelf()
        {
            // Arrange
            var userId = "2";
            var existingUser = new UserModel { Id = userId, Name = "Test User", ApiKey = "old-api-key" };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);
            _mockUserService.Setup(service => service.GenerateApiKey()).Returns("new-api-key");
            _mockUserService.Setup(service => service.Update(userId, It.IsAny<UserModel>())).ReturnsAsync(true);

            // Setup same user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = userId, Name = "Test User" } }
            });

            // Act
            var result = await _controller.RegenerateApiKey(userId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var apiKeyObj = Assert.IsAssignableFrom<object>(okResult.Value);
            var apiKeyValue = apiKeyObj.GetType().GetProperty("apiKey")?.GetValue(apiKeyObj);
            Assert.Equal("new-api-key", apiKeyValue);
        }

        [Fact]
        public async Task RegenerateApiKey_ReturnsOkResult_WithNewApiKey_WhenAdminUpdatesOtherUser()
        {
            // Arrange
            var userId = "2";
            var existingUser = new UserModel { Id = userId, Name = "Test User", ApiKey = "old-api-key" };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);
            _mockUserService.Setup(service => service.GenerateApiKey()).Returns("new-api-key");
            _mockUserService.Setup(service => service.Update(userId, It.IsAny<UserModel>())).ReturnsAsync(true);

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.RegenerateApiKey(userId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var apiKeyObj = Assert.IsAssignableFrom<object>(okResult.Value);
            var apiKeyValue = apiKeyObj.GetType().GetProperty("apiKey")?.GetValue(apiKeyObj);
            Assert.Equal("new-api-key", apiKeyValue);
        }

        [Fact]
        public async Task RegenerateApiKey_ReturnsNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            var userId = "nonexistent";

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync((UserModel?)null);

            // Act
            var result = await _controller.RegenerateApiKey(userId);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task RegenerateApiKey_ReturnsForbidden_WhenNonAdminTriesToRegenerateOtherUserKey()
        {
            // Arrange
            var userId = "2";
            var existingUser = new UserModel { Id = userId, Name = "Test User", ApiKey = "old-api-key" };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);

            // Setup different non-admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "3", Name = "Different User" } }
            });

            // Act
            var result = await _controller.RegenerateApiKey(userId);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task RegenerateApiKey_ReturnsInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            var userId = "2";
            var existingUser = new UserModel { Id = userId, Name = "Test User", ApiKey = "old-api-key" };

            _mockUserService.Setup(service => service.Get(userId)).ReturnsAsync(existingUser);
            _mockUserService.Setup(service => service.Update(userId, It.IsAny<UserModel>())).ThrowsAsync(new Exception("Test exception"));

            // Setup admin user in HttpContext
            _mockHttpContext.Setup(c => c.Items).Returns(new Dictionary<object, object?>
            {
                { "User", new UserModel { Id = "1", Name = AuthHelper.ADMIN_USER_NAME } }
            });

            // Act
            var result = await _controller.RegenerateApiKey(userId);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
        }

        #endregion
    }
}