# ImagesAPI Project

A .NET-based RESTful API that provides endpoints for image processing, user management, and real-time communication for the ImageProcessing application.

## Features

- **RESTful API**: Modern API following REST principles
- **Image Processing**: Integration with native ImagesProcessor library for filter application
- **API Key Authentication**: Secure access with API key authentication
- **Rate Limiting**: Built-in rate limiting protection against abuse
- **Real-time Updates**: SignalR integration for progress tracking during image processing
- **Response Caching**: Intelligent caching for improved performance
- **MongoDB Integration**: Persistent storage for images and user data
- **Dropbox Storage**: Cloud storage for image binary data
- **Comprehensive Logging**: Detailed logging of operations
- **Health Checks**: Monitoring endpoints for service health

## API Endpoints

The API provides the following main endpoint groups:

- `/Images`: Endpoints for image upload, download, editing and management
- `/Users`: User registration and management with API key generation
- `/health`: Health check endpoint for monitoring - used for deployment
- `/progressHub`: SignalR hub for real-time filter progress updates
- `/api/diagnostics`: System diagnostics (admin only)

For detailed documentation of all endpoints, run the API and navigate to `/swagger`.

## Authentication

The API uses API key authentication. To access protected endpoints:

1. An admin user is automatically created on first startup
2. Use the admin API key displayed in the console during first startup
3. Create additional users via `/users` endpoint
4. Include the API key in the X-API-Key header for all requests:
   ```
   X-API-Key: {your_api_key}
   ```

## Prerequisites

- Visual Studio 2022 (for Windows development)
- .NET SDK 8.x
- MongoDB instance
- Dropbox API credentials (or configured alternative storage provider)
- Make (for Linux builds)

## Environment Configuration

The application uses a `.env` file for environment configuration. Create a copy of `.env.example` and rename it to `.env`:

```bash
# Dropbox settings
DROPBOX_REFRESH_TOKEN=your_dropbox_refresh_token
DROPBOX_APP_KEY=your_dropbox_app_key
DROPBOX_APP_SECRET=your_dropbox_app_secret

# Mongo settings
MONGODB_CONNECTION_STRING=your_mongodb_connection_string
MONGODB_COLLECTION_NAME=your_images_collection_name
MONGODB_DATABASE_NAME=your_database_name

# Authentication settings
MONGODB_USERS_COLLECTION_NAME=your_users_collection_name
API_KEY_HEADER_NAME=X-API-Key
DEFAULT_RATE_LIMIT=60

FRONTEND_ORIGIN=http://localhost:4200
```

These environment variables will be loaded on application startup and take precedence over settings in `appsettings.json`.

## How to Build

### Step 1: Build the C++ ImagesProcessor Library

First, ensure the native ImagesProcessor library is built:

#### On Windows:

**Option 1: Using Visual Studio (Recommended)**

1. Open the ImagesProcessor solution in Visual Studio 2022:
   ```
   Open ../VC/ImagesProcessor/ImagesProcessor.sln
   ```

2. Build the solution in Release mode
   
3. Visual Studio will automatically place the DLL in the correct relative path for the .NET project to find it. The .NET project is configured to detect the environment (local development, Docker, or GitHub Actions) and locate the DLL accordingly.

**Option 2: Using CMake**

1. Navigate to the VC project directory:
   ```sh
   cd ../VC/ImagesProcessor
   ```

2. Create a build directory and navigate into it:
   ```sh
   mkdir build
   cd build
   ```

3. Configure and build the project:
   ```sh
   cmake -G "Visual Studio 17 2022" -A x64 ..
   cmake --build . --config Release
   ```

4. Copy the resulting DLL to the .NET API's directory:
   ```sh
   copy bin\Release\ImagesProcessor.dll ..\..\DotNet\ImagesAPI\ImagesAPI\
   ```

#### On Linux:

1. Navigate to the VC project directory:
   ```sh
   cd ../VC/ImagesProcessor
   ```

2. Build using make:
   ```sh
   make
   ```

3. The shared library (`libImagesProcessor.so`) will be built and should be placed where the .NET API can find it.

### Step 2: Configure the .NET API

1. Create a `.env` file from the `.env.example` template
2. Fill in all required environment variables with your values

### Step 3: Build and Run the .NET API

#### On Windows:

**Option 1: Using Visual Studio (Recommended)**

1. Open the ImagesAPI solution in Visual Studio 2022:
   ```
   Open ImagesAPI/ImagesAPI.sln
   ```

2. Ensure the ImagesAPI project is set as the startup project
   
3. Press F5 or click the "Start Debugging" button

Visual Studio will automatically detect the environment (local development, Docker, or GitHub Actions) and find the appropriate path for the native ImagesProcessor DLL. The project includes configuration to handle the different paths for each environment.

**Option 2: Using dotnet CLI**

```sh
cd back-end/DotNet/ImagesAPI
dotnet build
dotnet run --project ImagesAPI
```

#### On Linux:

```sh
cd back-end/DotNet/ImagesAPI
dotnet build
dotnet run --project ImagesAPI
```

Note: If you're developing on Windows using Visual Studio, you can still open the solution file and run from there after ensuring the C++ project is properly built.

### Step 4: Test the API

Run the tests to verify everything is working correctly:

```sh
cd back-end/DotNet/ImagesAPITests
dotnet test
```

## Configuration

Configure the API using:

- `appsettings.json`: Base configuration
- `appsettings.Development.json`: Development environment overrides
- Environment variables: Runtime configuration

Key configuration sections:

- `MongoDBSettings`: MongoDB connection settings
- `DropboxAPISettings`: Dropbox API credentials
- `UserSettings`: API key and rate limiting settings

## Docker Deployment

Build and run the Docker image:

```sh
docker build -t imagesapi . 
docker run -p 8080:80 imagesapi
```

## Using the API with the Frontend

The Angular frontend connects to this API using the endpoints provided. Ensure CORS settings are properly configured to allow connections from the frontend origin.

## Troubleshooting

If you encounter issues:

1. Check the `ImagesProcessorLogs/` directory for detailed error logs
2. Use the `/api/diagnostics/native-library-status` endpoint (admin only) to verify native library loading
3. Ensure MongoDB is running and accessible
4. Verify that the Dropbox API credentials are correct
5. Check that the ImagesProcessor.dll is in the correct location

## License

Copyright © 2025