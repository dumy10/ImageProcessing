using DotNetEnv;
using ImagesAPI.Hubs;
using ImagesAPI.Middleware;
using ImagesAPI.Models;
using ImagesAPI.Services.Concretes;
using ImagesAPI.Services.Interfaces;
using ImagesAPI.Settings.Concretes;
using ImagesAPI.Settings.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;

Env.Load();

string[] variables = [
    "MONGODB_CONNECTION_STRING", "MONGODB_DATABASE_NAME", "MONGODB_COLLECTION_NAME", "MONGODB_USERS_COLLECTION_NAME", 
    "DROPBOX_APP_KEY", "DROPBOX_APP_SECRET", "DROPBOX_REFRESH_TOKEN"
    ];

foreach (var variable in variables)
{
    if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(variable)))
    {
        throw new ArgumentNullException($"The {variable} environment variable is not set.");
    }
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
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
                          policy.WithOrigins("http://localhost:4200") // Origins are needed for SignalR
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials();
                      });
});

var app = builder.Build();

// Seed initial admin user with API key
using (var scope = app.Services.CreateScope())
{
    var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
    SeedInitialAdminUser(userService).Wait();
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

// Add API key authentication and rate limiting middleware
app.UseApiKeyAuthentication();

app.UseRouting();

app.UseAuthorization();

app.UseHttpsRedirection();

app.MapControllers();
app.MapHub<ProgressHub>("/progressHub");

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
