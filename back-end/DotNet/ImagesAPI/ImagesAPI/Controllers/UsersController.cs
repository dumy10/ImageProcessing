using ImagesAPI.Helpers;
using ImagesAPI.Logger;
using ImagesAPI.Models;
using ImagesAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ImagesAPI.Controllers
{
    /// <summary>
    /// Controller for managing API users
    /// </summary>
    /// <remarks>
    /// Initializes a new instance of the UsersController class
    /// </remarks>
    /// <param name="userService">The user service</param>
    [ApiController]
    [Route("[controller]")]
    public class UsersController(IUserService userService) : ControllerBase
    {
        private readonly IUserService _userService = userService ?? throw new ArgumentNullException(nameof(userService));

        /// <summary>
        /// Gets all users (admin only)
        /// </summary>
        /// <returns>List of all users</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                // Check if the current user is an admin
                if (!AuthHelper.IsAdmin(HttpContext))
                {
                    Logging.Instance.LogWarning($"Unauthorized attempt to access all users by non-admin user");
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only administrators can view all users" });
                }

                var users = await _userService.GetAll();
                return Ok(users);
            }
            catch (Exception ex)
            {
                Logging.Instance.LogError($"Error retrieving users: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while retrieving users");
            }
        }

        /// <summary>
        /// Gets a user by ID
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <returns>The user</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetUser(string id)
        {
            try
            {
                // Check if the current user is an admin or the user themselves
                var currentUser = AuthHelper.GetCurrentUser(HttpContext);
                if (currentUser?.Id != id && !AuthHelper.IsAdmin(HttpContext))
                {
                    Logging.Instance.LogWarning($"Unauthorized attempt to access user {id} by non-admin user");
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only view your own user data unless you are an administrator" });
                }


                var user = await _userService.Get(id);
                if (user == null)
                {
                    return NotFound($"User with ID {id} not found");
                }

                // Send only the user data without the API key
                var userData = new UserDTO
                {
                    Id = user.Id,
                    Name = user.Name,
                    RateLimit = user.RateLimit,
                    IsActive = user.IsActive
                };

                return Ok(userData);
            }
            catch (Exception ex)
            {
                Logging.Instance.LogError($"Error retrieving user: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while retrieving the user");
            }
        }

        /// <summary>
        /// Creates a new user
        /// </summary>
        /// <param name="createUserDto">The user data to create a new user</param>
        /// <returns>The created user</returns>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDTO? createUserDto)
        {
            if (createUserDto == null)
            {
                return BadRequest("User data is required");
            }

            try
            {
                // Check if the current user is an admin
                if (!AuthHelper.IsAdmin(HttpContext))
                {
                    Logging.Instance.LogWarning($"Unauthorized attempt to create a user by non-admin user");
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only administrators can create users" });
                }

                // Check if a user with the same name already exists
                var existingUsers = await _userService.GetAll();
                if (existingUsers.Any(u => u.Name.Equals(createUserDto.Name, StringComparison.OrdinalIgnoreCase)))
                {
                    Logging.Instance.LogWarning($"Attempt to create a user with duplicate name: {createUserDto.Name}");
                    return StatusCode(StatusCodes.Status409Conflict, new { message = $"A user with the name '{createUserDto.Name}' already exists" });
                }

                // Create a new user object with only the name and ratelimit from the DTO
                var newUser = new UserModel
                {
                    Name = createUserDto.Name,
                    RateLimit = createUserDto.RateLimit,
                    Id = Guid.NewGuid().ToString(),
                    ApiKey = _userService.GenerateApiKey()
                };

                await _userService.Create(newUser);
                return CreatedAtAction(nameof(GetUser), new { id = newUser.Id }, newUser);
            }
            catch (Exception ex)
            {
                Logging.Instance.LogError($"Error creating user: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while creating the user");
            }
        }

        /// <summary>
        /// Updates a user
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <param name="updateUserDto">The updated user data</param>
        /// <returns>No content if successful</returns>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDTO? updateUserDto)
        {
            if (updateUserDto == null)
            {
                return BadRequest("User data is required");
            }

            // Get the current user
            var currentUser = AuthHelper.GetCurrentUser(HttpContext);

            // Allow users to update their own data or admin to update any user
            if (currentUser?.Id != id && !AuthHelper.IsAdmin(HttpContext))
            {
                Logging.Instance.LogWarning($"Unauthorized attempt to update user {id} by non-admin user");
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only update your own user data unless you are an administrator" });
            }

            try
            {
                var existingUser = await _userService.Get(id);
                if (existingUser == null)
                {
                    return NotFound($"User with ID {id} not found");
                }

                // Prevent non-admins from changing their name to "Admin User"
                if (!AuthHelper.IsAdmin(HttpContext) && updateUserDto.Name == AuthHelper.ADMIN_USER_NAME && existingUser.Name != AuthHelper.ADMIN_USER_NAME)
                {
                    Logging.Instance.LogWarning($"Unauthorized attempt to change name to Admin User by non-admin user");
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You cannot set your name to Admin User" });
                }

                // Check if the new name is different from the current name and if it already exists
                if (!string.Equals(existingUser.Name, updateUserDto.Name, StringComparison.OrdinalIgnoreCase))
                {
                    var existingUsers = await _userService.GetAll();
                    if (existingUsers.Any(u => u.Id != id && u.Name.Equals(updateUserDto.Name, StringComparison.OrdinalIgnoreCase)))
                    {
                        Logging.Instance.LogWarning($"Attempt to update user with duplicate name: {updateUserDto.Name}");
                        return StatusCode(StatusCodes.Status409Conflict, new { message = $"A user with the name '{updateUserDto.Name}' already exists" });
                    }
                }

                // Update only the fields from the DTO
                existingUser.Name = updateUserDto.Name;
                existingUser.RateLimit = updateUserDto.RateLimit;

                await _userService.Update(id, existingUser);
                return NoContent();
            }
            catch (Exception ex)
            {
                Logging.Instance.LogError($"Error updating user: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while updating the user");
            }
        }

        /// <summary>
        /// Deletes a user
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <returns>No content if successful</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteUser(string id)
        {

            // Check if the current user is an admin
            if (!AuthHelper.IsAdmin(HttpContext))
            {
                Logging.Instance.LogWarning($"Unauthorized attempt to delete a user by non-admin user");
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only administrators can delete users" });
            }

            try
            {
                var user = await _userService.Get(id);
                if (user == null)
                {
                    return NotFound($"User with ID {id} not found");
                }

                await _userService.Delete(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                Logging.Instance.LogError($"Error deleting user: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while deleting the user");
            }
        }

        /// <summary>
        /// Generates a new API key for a user
        /// </summary>
        /// <param name="id">The user ID</param>
        /// <returns>The new API key</returns>
        [HttpPost("{id}/regenerate-key")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> RegenerateApiKey(string id)
        {

            // Get the current user
            var currentUser = AuthHelper.GetCurrentUser(HttpContext);

            // Allow users to regenerate their own API key or admin to regenerate any user's key
            if (currentUser?.Id != id && !AuthHelper.IsAdmin(HttpContext))
            {
                Logging.Instance.LogWarning($"Unauthorized attempt to regenerate API key for user {id} by non-admin user");
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only regenerate your own API key unless you are an administrator" });
            }

            try
            {
                var user = await _userService.Get(id);
                if (user == null)
                {
                    return NotFound($"User with ID {id} not found");
                }

                user.ApiKey = _userService.GenerateApiKey();
                await _userService.Update(id, user);

                return Ok(new { apiKey = user.ApiKey });
            }
            catch (Exception ex)
            {
                Logging.Instance.LogError($"Error regenerating API key: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while regenerating the API key");
            }
        }
    }
}