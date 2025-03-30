using DotNetEnv;
using ImagesAPI.Services.Concretes;
using ImagesAPI.Services.Interfaces;
using ImagesAPI.Settings.Concretes;
using ImagesAPI.Settings.Interfaces;
using Microsoft.Extensions.Options;

Env.Load();

string[] variables = ["MONGODB_CONNECTION_STRING", "MONGODB_DATABASE_NAME", "MONGODB_COLLECTION_NAME", "DROPBOX_APP_KEY", "DROPBOX_APP_SECRET", "DROPBOX_REFRESH_TOKEN"];
foreach (var variable in variables)
{
    if(string.IsNullOrEmpty(Environment.GetEnvironmentVariable(variable)))
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
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

// Configure settings
builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection(nameof(MongoDBSettings)));
builder.Services.AddSingleton<IMongoDBSettings>(sp => sp.GetRequiredService<IOptions<MongoDBSettings>>().Value);

builder.Services.Configure<DropboxAPISettings>(builder.Configuration.GetSection(nameof(DropboxAPISettings)));
builder.Services.AddSingleton<IDropboxAPISettings>(sp => sp.GetRequiredService<IOptions<DropboxAPISettings>>().Value);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "CorsPolicy",
                              policy =>
                              {
                                  policy.AllowAnyOrigin()
                                  .AllowAnyHeader()
                                  .AllowAnyMethod();
                              });
});

var app = builder.Build();

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

app.UseRouting();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
