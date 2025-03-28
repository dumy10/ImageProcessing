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
        throw new Exception($"The {variable} environment variable is not set.");
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

// Add services to the container.
builder.Services.AddSingleton<IImagesCollectionService, ImagesCollectionService>();
builder.Services.AddSingleton<IDropboxService, DropboxService>();

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

app.UseRouting();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
