using DotNetEnv;
using ImagesAPI.Helpers;
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

Env.Load();


// Skip environment variable validation in Docker test environment
bool skipValidation = Environment.GetEnvironmentVariable("RUNNING_IN_DOCKER") == "true" && 
                     Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" ||
                     Environment.GetEnvironmentVariable("SKIP_VALIDATION") == "true";

if (!skipValidation)
{
    string[] variables = [
        "MONGODB_CONNECTION_STRING", "MONGODB_DATABASE_NAME", "MONGODB_COLLECTION_NAME", "MONGODB_USERS_COLLECTION_NAME", 
        "DROPBOX_APP_KEY", "DROPBOX_APP_SECRET", "DROPBOX_REFRESH_TOKEN", "FRONTEND_ORIGIN"
        ];

    foreach (var variable in variables)
    {
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(variable)))
        {
            throw new ArgumentNullException($"The {variable} environment variable is not set.");
        }
    }
}
else
{
    Console.WriteLine("Running in Docker test environment - skipping environment variable validation");
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    // Reuse settings from JsonOptions.DefaultOptions
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = JsonOptions.DefaultOptions.PropertyNameCaseInsensitive;
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonOptions.DefaultOptions.PropertyNamingPolicy;
    options.JsonSerializerOptions.WriteIndented = JsonOptions.DefaultOptions.WriteIndented;
});

// Add health checks
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("API is running."))
    // Only attempt to check MongoDB if we're not in Docker testing mode
    .AddCheck("environment", () => 
    {
        return skipValidation 
            ? HealthCheckResult.Healthy("Running in test mode")
            : HealthCheckResult.Healthy("Environment variables validated");
    });

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
        Name = "X-API-Key", // Should match your ApiKeyHeaderName in UserSettings
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

// Add SignalR for real-time progress updates
builder.Services.AddSignalR();

// Add memory cache with a size limit
builder.Services.AddMemoryCache(options =>
{
    // Set a size limit to prevent cache from consuming too much memory
    options.SizeLimit = 50 * 1024 * 1024; // 50 MB limit
});

// Add response caching
builder.Services.AddResponseCaching(options =>
{
    options.MaximumBodySize = 10 * 1024 * 1024; // 10 MB response size limit
    options.UseCaseSensitivePaths = false;
});

// Add services to the container.
builder.Services.AddSingleton<IImagesCollectionService, ImagesCollectionService>();
builder.Services.AddSingleton<IDropboxService, DropboxService>();
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
builder.Services.AddSingleton<IUserService, UserService>();
builder.Services.AddSingleton<IProgressTrackerService, ProgressTrackerService>();

// Configure settings
builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection(nameof(MongoDBSettings)));
builder.Services.AddSingleton<IMongoDBSettings>(sp => sp.GetRequiredService<IOptions<MongoDBSettings>>().Value);

builder.Services.Configure<DropboxAPISettings>(builder.Configuration.GetSection(nameof(DropboxAPISettings)));
builder.Services.AddSingleton<IDropboxAPISettings>(sp => sp.GetRequiredService<IOptions<DropboxAPISettings>>().Value);

builder.Services.Configure<UserSettings>(builder.Configuration.GetSection(nameof(UserSettings)));
builder.Services.AddSingleton<IUserSettings>(sp => sp.GetRequiredService<IOptions<UserSettings>>().Value);

// Add CORS policy
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

var app = builder.Build();

// Only seed admin user if we're not in Docker test mode
if (!skipValidation)
{
    // Seed initial admin user with API key
    using var scope = app.Services.CreateScope();
    var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
    SeedInitialAdminUser(userService).Wait();
}
else
{
    Console.WriteLine("Running in test mode - skipping admin user creation");
}

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("CorsPolicy");

// Enable response caching middleware
app.UseResponseCaching();

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

// Custom middleware to add API key to headers for SignalR hub
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/progressHub"))
    {
        var apiKey = context.Request.Query["apiKey"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            // Add the API key to the headers so the existing middleware can process it
            context.Request.Headers.Append("X-API-Key", apiKey);
        }
    }

    await next.Invoke();
});

// First add routing so the system knows which endpoint is being requested
app.UseRouting();

// Now add API key authentication - this will come after routing
// This ordering allows the AllowAnonymous attribute to be respected
app.UseApiKeyAuthentication();

app.UseAuthorization();

app.UseHttpsRedirection();

// Add a simple health check endpoint that doesn't require authentication
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
        
        // Use the cached JsonSerializerOptions instance
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions.DefaultOptions));
    }
}).AllowAnonymous();

// Add a simple public root endpoint for quick verification
app.MapGet("/", () => "ImagesAPI is running. Use /health for status checks or /swagger for API documentation.").AllowAnonymous();

app.MapControllers();
app.MapHub<ProgressHub>("/progressHub");

// Add a diagnostic endpoint to help debug native library loading
app.MapGet("/system-info", () => {
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

app.Run();

// Helper method to seed the initial admin user
static async Task SeedInitialAdminUser(IUserService userService)
{
    try
    {
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
