using ImagesAPI.Hubs;
using ImagesAPI.Middleware;
using ImagesAPI.Models;
using ImagesAPI.Services.Concretes;
using ImagesAPI.Services.Interfaces;
using ImagesAPI.Settings.Concretes;
using ImagesAPI.Settings.Interfaces;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using System.Text.Json;

namespace ImagesAPI.Helpers
{
    /// <summary>
    /// Class containing helper methods for the startup process of the Images API.
    /// </summary>
    public static class StartupHelper
    {
        #region Public Methods

        /// <summary>
        /// Configures the application builder with necessary services, settings, and middleware.
        /// </summary>
        /// <param name="builder"></param>
        /// <param name="skipValidation"></param>
        public static void ConfigureBuilder(WebApplicationBuilder builder, bool skipValidation)
        {
            // Add services to the container.
            RegisterServices(builder);

            // Configure Swagger
            ConfigureSwagger(builder);

            // Configure settings
            ConfigureSettings(builder);

            // Add CORS policy
            ConfigureCors(builder);

            // Add health checks
            ConfigureHealthChecks(builder, skipValidation);
        }
        
        /// <summary>
        /// Configures the application with necessary middleware and endpoints.
        /// </summary>
        /// <param name="app"></param>
        public static void ConfigureApplication(WebApplication app)
        {
            // Configure middleware
            ConfigureMiddleware(app);

            // Configure health checks endpoints
            ConfigureHealthChecks(app);

            // Configure application endpoints
            ConfigureEndpoints(app);
        }

        /// <summary>
        /// Logs diagnostic information about native libraries.
        /// </summary>
        public static void RunNativeLibraryDiagnostics()
        {
            try
            {
                var appDirectory = AppDomain.CurrentDomain.BaseDirectory;
                var logMessage = new System.Text.StringBuilder();
                logMessage.AppendLine("---------- NATIVE DEPENDENCY DIAGNOSTIC INFO ----------");
                logMessage.AppendLine($"Application directory: {appDirectory}");
                logMessage.AppendLine($"Current directory: {Environment.CurrentDirectory}");
                logMessage.AppendLine($"LD_LIBRARY_PATH: {Environment.GetEnvironmentVariable("LD_LIBRARY_PATH") ?? "not set"}");
                logMessage.AppendLine($"RUNNING_IN_DOCKER: {Environment.GetEnvironmentVariable("RUNNING_IN_DOCKER") ?? "not set"}");

                // Check for ImagesProcessor native library
                string[] possibleLibraryNames = ["ImagesProcessor.dll", "libImagesProcessor.so", "libImagesProcessor.so.1"];

                foreach (var libraryName in possibleLibraryNames)
                {
                    var libraryPath = Path.Combine(appDirectory, libraryName);
                    logMessage.AppendLine($"Checking for {libraryPath}: {File.Exists(libraryPath)}");
                }

                // Test loading the library programmatically
                try
                {
                    if (OperatingSystem.IsWindows())
                    {
                        logMessage.AppendLine("Attempting to load ImagesProcessor.dll");
                        var handle = System.Runtime.InteropServices.NativeLibrary.Load(Path.Combine(appDirectory, "ImagesProcessor.dll"));
                        logMessage.AppendLine("Successfully loaded ImagesProcessor.dll");
                        System.Runtime.InteropServices.NativeLibrary.Free(handle);
                    }
                    else
                    {
                        logMessage.AppendLine("Attempting to load libImagesProcessor.so");
                        var handle = System.Runtime.InteropServices.NativeLibrary.Load(Path.Combine(appDirectory, "libImagesProcessor.so"));
                        logMessage.AppendLine("Successfully loaded libImagesProcessor.so");
                        System.Runtime.InteropServices.NativeLibrary.Free(handle);
                    }
                }
                catch (Exception ex)
                {
                    logMessage.AppendLine($"Error loading native library: {ex.Message}");
                    if (ex.InnerException != null)
                    {
                        logMessage.AppendLine($"Inner exception: {ex.InnerException.Message}");
                    }
                }

                logMessage.AppendLine("---------- END DIAGNOSTIC INFO ----------");
                Console.WriteLine(logMessage.ToString());

                // Also write to a file that will persist in the container
                File.WriteAllText(Path.Combine(appDirectory, "native_library_diagnostic.log"), logMessage.ToString());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in diagnostic code: {ex.Message}");
            }
        }

        /// <summary>
        /// Determines if environment variable validation should be skipped.
        /// </summary>
        /// <returns></returns>
        public static bool ShouldSkipValidation()
        {
            return Environment.GetEnvironmentVariable("RUNNING_IN_DOCKER") == "true" &&
                      Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" ||
                      Environment.GetEnvironmentVariable("SKIP_VALIDATION") == "true";
        }

        /// <summary>
        /// Validates required environment variables for the application.
        /// </summary>
        /// <param name="skipValidation"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public static void ValidateEnvironmentVariables(bool skipValidation)
        {
            if (skipValidation)
            {
                Console.WriteLine("Running in Docker test environment - skipping environment variable validation");
                return;
            }

            string[] variables = ["MONGODB_CONNECTION_STRING", "MONGODB_DATABASE_NAME", "MONGODB_COLLECTION_NAME", "MONGODB_USERS_COLLECTION_NAME",
                "DROPBOX_APP_KEY", "DROPBOX_APP_SECRET", "DROPBOX_REFRESH_TOKEN", "FRONTEND_ORIGIN"];

            foreach (string variable in variables)
            {
                if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(variable)))
                {
                    throw new ArgumentNullException($"The {variable} environment variable is not set.");
                }
            }
        }

        /// <summary>
        /// Seeds the initial admin user if none exists.
        /// </summary>
        /// <param name="app"></param>
        /// <param name="skipValidation"></param>
        /// <returns></returns>
        public static async Task SeedInitialAdminUser(WebApplication app, bool skipValidation)
        {
            if (skipValidation)
            {
                Console.WriteLine("Running in test mode - skipping admin user creation");
                return;
            }

            try
            {
                using var scope = app.Services.CreateScope();
                var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
                // Check if there are any users already
                var existingUsers = await userService.GetAll();
                if (existingUsers == null || existingUsers.Count == 0)
                {
                    // Create an admin user with higher rate limits
                    var adminUser = new UserModel
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = "Admin User",
                        IsActive = true,
                        RateLimit = 200, // Higher rate limit for admin
                        ApiKey = userService.GenerateApiKey()  // Generate API key
                    };

                    // Save to database
                    await userService.Create(adminUser);

                    // Output the API key to the console for first-time use
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("====================================================");
                    Console.WriteLine($"Created initial admin user with API key: {adminUser.ApiKey}");
                    Console.WriteLine("Save this key somewhere safe as it won't be displayed again!");
                    Console.WriteLine("====================================================");
                    Console.ResetColor();
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"Error creating initial admin user: {ex.Message}");
                Console.ResetColor();
            }
        }

        #endregion

        #region Private Methods

        #region Builder Configuration Methods

        /// <summary>
        /// Configures Swagger with API key authentication for the Images API.
        /// </summary>
        /// <param name="builder"></param>
        private static void ConfigureSwagger(WebApplicationBuilder builder)
        {
            // Configure Swagger with API key authentication
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Images API",
                    Version = "v1",
                    Description = "API for image processing operations"
                });

                // Define the API Key scheme
                c.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
                {
                    Description = "API Key authentication using the 'X-API-Key' header",
                    Name = "X-API-Key", // Should match the ApiKeyHeaderName in UserSettings
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "ApiKey"
                });

                // Make sure all operations require API Key
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "ApiKey"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });
        }

        /// <summary>
        /// Register all application services.
        /// </summary>
        /// <param name="builder"></param>
        private static void RegisterServices(WebApplicationBuilder builder)
        {
            // Add controllers with JSON options
            builder.Services.AddControllers().AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNameCaseInsensitive = JsonOptions.DefaultOptions.PropertyNameCaseInsensitive;
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonOptions.DefaultOptions.PropertyNamingPolicy;
                options.JsonSerializerOptions.WriteIndented = JsonOptions.DefaultOptions.WriteIndented;
            });

            // Add SignalR for real-time progress updates
            builder.Services.AddSignalR();

            // Add memory cache with a size limit
            builder.Services.AddMemoryCache(options => options.SizeLimit = 50 * 1024 * 1024); // Set a size limit to prevent cache from consuming too much memory - 50 MB limit

            // Add response caching
            builder.Services.AddResponseCaching(options =>
            {
                options.MaximumBodySize = 10 * 1024 * 1024; // 10 MB response size limit
                options.UseCaseSensitivePaths = false;
            });            
            
            // Add application services to the container.
            builder.Services.AddSingleton<IImagesCollectionService, ImagesCollectionService>();
            builder.Services.AddSingleton<IDropboxService, DropboxService>();
            builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
            builder.Services.AddSingleton<IUserService, UserService>();
            builder.Services.AddSingleton<IProgressTrackerService, ProgressTrackerService>();
            builder.Services.AddSingleton<IImageCacheManager, ImageCacheManager>();
            builder.Services.AddSingleton<IImageProgressTracker, ImageProgressTracker>();
        }

        /// <summary>
        /// Configures application settings from configuration.
        /// </summary>
        /// <param name="builder"></param>
        private static void ConfigureSettings(WebApplicationBuilder builder)
        {
            // Configure MongoDB settings
            builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection(nameof(MongoDBSettings)));
            builder.Services.AddSingleton<IMongoDBSettings>(sp => sp.GetRequiredService<IOptions<MongoDBSettings>>().Value);

            // Configure Dropbox API settings
            builder.Services.Configure<DropboxAPISettings>(builder.Configuration.GetSection(nameof(DropboxAPISettings)));
            builder.Services.AddSingleton<IDropboxAPISettings>(sp => sp.GetRequiredService<IOptions<DropboxAPISettings>>().Value);

            // Configure User settings
            builder.Services.Configure<UserSettings>(builder.Configuration.GetSection(nameof(UserSettings)));
            builder.Services.AddSingleton<IUserSettings>(sp => sp.GetRequiredService<IOptions<UserSettings>>().Value);
        }

        /// <summary>
        /// Configures CORS policy for the application.
        /// </summary>
        /// <param name="builder"></param>
        private static void ConfigureCors(WebApplicationBuilder builder)
        {
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(name: "CorsPolicy",
                                  policy =>
                                  {
                                      policy.WithOrigins(Environment.GetEnvironmentVariable("FRONTEND_ORIGIN")!) // Origins are needed for SignalR
                                            .AllowAnyHeader()
                                            .AllowAnyMethod()
                                            .AllowCredentials();
                                  });
            });
        }

        /// <summary>
        /// Configures health checks for the application.
        /// </summary>
        /// <param name="builder"></param>
        /// <param name="skipValidation"></param>
        private static void ConfigureHealthChecks(WebApplicationBuilder builder, bool skipValidation)
        {
            builder.Services.AddHealthChecks()
                .AddCheck("self", () => HealthCheckResult.Healthy("API is running."))
                .AddCheck("environment", () => skipValidation
                ? HealthCheckResult.Healthy("Running in docker mode")
                : HealthCheckResult.Healthy("Environment variables are set correctly"));
        }

        #endregion

        #region Application Configuration Methods

        /// <summary>
        /// Configures health checks endpoints
        /// </summary>
        /// <param name="app"></param>
        private static void ConfigureHealthChecks(WebApplication app)
        {
            app.MapHealthChecks("/health", new HealthCheckOptions
            {
                ResponseWriter = async (context, report) =>
                {
                    context.Response.ContentType = "application/json";
                    var response = new
                    {
                        status = report.Status.ToString(),
                        components = report.Entries.Select(e => new
                        {
                            key = e.Key,
                            value = e.Value.Status.ToString(),
                            description = e.Value.Description
                        }),
                        totalDuration = report.TotalDuration
                    };

                    await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions.DefaultOptions));
                }
            }).AllowAnonymous();
        }

        /// <summary>
        /// Configures the HTTP request pipeline middleware for the application.
        /// </summary>
        /// <param name="app"></param>
        private static void ConfigureMiddleware(WebApplication app)
        {
            // Configure the HTTP request pipeline.
            app.UseSwagger();
            app.UseSwaggerUI();

            app.UseCors("CorsPolicy");
            app.UseResponseCaching(); // Enable response caching middleware

            // Add custom middleware to add cache control headers where needed
            app.Use(async (context, next) =>
            {
                // Set cache control headers for static files and API responses
                context.Response.GetTypedHeaders().CacheControl = new Microsoft.Net.Http.Headers.CacheControlHeaderValue()
                {
                    Public = true,
                    MaxAge = TimeSpan.FromHours(1)
                };

                await next();
            });

            app.UseRouting();
            app.UseApiKeyAuthentication();
            app.UseAuthorization();
            app.UseHttpsRedirection();
        }

        /// <summary>
        /// Configures the application endpoints
        /// </summary>
        /// <param name="app"></param>
        private static void ConfigureEndpoints(WebApplication app)
        {
            // Add a simple public root endpoint for quick verification
            app.MapGet("/", () => "ImagesAPI is running. Use /health for status checks or /swagger for API documentation.").AllowAnonymous();

            app.MapControllers();
            app.MapHub<ProgressHub>("/progressHub");

            // Add a diagnostic endpoint to help debug native library loading
            app.MapGet("/system-info", (HttpContext context) =>
            {
                if (!AuthHelper.IsAdmin(context))
                {
                    return Results.Unauthorized();
                }

                var info = new Dictionary<string, string>
                {
                    { "OS", Environment.OSVersion.ToString() },
                    { "Runtime", System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription },
                    { "Environment", Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Not set" },
                    { "Docker", Environment.GetEnvironmentVariable("RUNNING_IN_DOCKER") ?? "Not set" },
                    { "Working Directory", Environment.CurrentDirectory },
                    { "Library Path", Environment.GetEnvironmentVariable("LD_LIBRARY_PATH") ?? "Not set" },
                    { "ImagesProcessor Library Exists", File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "libImagesProcessor.so")).ToString() }
                };
                return Results.Ok(info);
            }).AllowAnonymous();
        }

        #endregion

        #endregion
    }
}
