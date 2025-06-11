using DotNetEnv;
using ImagesAPI.Helpers;

// Run diagnostic code to check native library loading issues
StartupHelper.RunNativeLibraryDiagnostics();

Env.Load();

bool skipValidation = StartupHelper.ShouldSkipValidation();

// Validate environment variables
StartupHelper.ValidateEnvironmentVariables(skipValidation);

var builder = WebApplication.CreateBuilder(args);

StartupHelper.ConfigureBuilder(builder, skipValidation);

var app = builder.Build();

// Only seed admin user if we're not in Docker test mode
await StartupHelper.SeedInitialAdminUser(app, skipValidation);

StartupHelper.ConfigureApplication(app);

app.Run();
