FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
# Set timezone and disable interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

WORKDIR /app

EXPOSE 80
EXPOSE 443
EXPOSE 8080

# Install runtime dependencies required for SkiaSharp in the base image
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tzdata \
        libfontconfig1 \
        libfreetype6 \
        libgl1-mesa-dev \
        libgif7 \
        libpng16-16 \
        libjpeg62-turbo \
        # Add tools for diagnostics
        procps \
        curl \
        strace \
        file \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/lib/x86_64-linux-gnu/libfontconfig.so.1 /usr/lib/x86_64-linux-gnu/libfontconfig.so \
    && ln -sf /usr/lib/x86_64-linux-gnu/libfreetype.so.6 /usr/lib/x86_64-linux-gnu/libfreetype.so

# Build the C++ native libraries
FROM ubuntu:22.04 AS cpp-build
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

WORKDIR /src

# Install required packages for building C++ project
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tzdata \
        build-essential \
        ca-certificates \
        cmake \
        g++ \
        make \
        git \
        libopencv-dev \
        wget \
        pkg-config \
        libtbb-dev \
        file \
    && rm -rf /var/lib/apt/lists/*

# Copy C++ project files
COPY ["back-end/VC/ImagesProcessor", "/src/ImagesProcessor"]

# Build the C++ project using CMake, but skip building tests
WORKDIR /src/ImagesProcessor/BUILD
RUN cmake -DBUILD_TESTS=OFF .. \
    && cmake --build . --config Release --target ImagesProcessor \
    && mkdir -p /build-output \
    && cp bin/libImagesProcessor.so /build-output/ \
    # Verify the library was built successfully
    && ls -la /build-output/ \
    && file /build-output/libImagesProcessor.so

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC
# Set the environment variable to indicate Docker environment
ENV RUNNING_IN_DOCKER=true

# Install development dependencies for native libraries (libSkiaSharp)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tzdata \
        libc6-dev \
        libfontconfig1-dev \
        libfreetype6-dev \
        libgl1-mesa-dev \
        libglib2.0-dev \
        libicu-dev \
        libpng-dev \
        libgif-dev \
        libjpeg62 \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/lib/x86_64-linux-gnu/libfontconfig.so.1 /usr/lib/x86_64-linux-gnu/libfontconfig.so \
    && ln -sf /usr/lib/x86_64-linux-gnu/libfreetype.so.6 /usr/lib/x86_64-linux-gnu/libfreetype.so

WORKDIR /src

# Copy the native library from cpp-build - place it in the build tree before starting the build
COPY --from=cpp-build /build-output/libImagesProcessor.so /src/

# Restore dependencies first
COPY ["back-end/DotNet/ImagesAPI/ImagesAPI/ImagesAPI.csproj", "ImagesAPI/"]
RUN dotnet restore "ImagesAPI/ImagesAPI.csproj"

# Copy the rest of the source code
COPY ["back-end/DotNet/ImagesAPI", "/src"]

# Build the project
WORKDIR "/src/ImagesAPI"
RUN dotnet build "ImagesAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ImagesAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=cpp-build /build-output/libImagesProcessor.so /app/

# Create logs directory with appropriate permissions
RUN mkdir -p /app/ImagesProcessorLogs && chmod 777 /app/ImagesProcessorLogs

# Make sure permissions are set correctly and verify the library exists
RUN chmod +x /app/libImagesProcessor.so \
    && ls -la /app/libImagesProcessor.so \
    && file /app/libImagesProcessor.so

# Initialize LD_LIBRARY_PATH if it doesn't exist and then set the library path
ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH:-}
ENV LD_LIBRARY_PATH=/app:${LD_LIBRARY_PATH}

# Set the environment variable to indicate Docker environment
ENV RUNNING_IN_DOCKER=true
# Set the port environment variable for ASP.NET Core
ENV ASPNETCORE_URLS=http://+:8080
# Add Debug environment variables for better diagnostics
ENV ASPNETCORE_ENVIRONMENT=Development
ENV DOTNET_ENVIRONMENT=Development
# Enable detailed error messages
ENV ASPNETCORE_DETAILED_ERRORS=true
# Additional settings to help with native library loading
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

# Set mock environment variables for testing
# These are required by the application to start
ENV MONGODB_CONNECTION_STRING="mongodb://mongodb:27017"
ENV MONGODB_DATABASE_NAME="imagesdb_test"
ENV MONGODB_COLLECTION_NAME="images_test"
ENV MONGODB_USERS_COLLECTION_NAME="users_test"
ENV DROPBOX_APP_KEY="test_app_key"
ENV DROPBOX_APP_SECRET="test_app_secret"
ENV DROPBOX_REFRESH_TOKEN="test_refresh_token"
ENV FRONTEND_ORIGIN="http://localhost:4200"

# Create a .env file to load environment variables
RUN echo "MONGODB_CONNECTION_STRING=mongodb://mongodb:27017" > /app/.env \
    && echo "MONGODB_DATABASE_NAME=imagesdb_test" >> /app/.env \
    && echo "MONGODB_COLLECTION_NAME=images_test" >> /app/.env \
    && echo "MONGODB_USERS_COLLECTION_NAME=users_test" >> /app/.env \
    && echo "DROPBOX_APP_KEY=test_app_key" >> /app/.env \
    && echo "DROPBOX_APP_SECRET=test_app_secret" >> /app/.env \
    && echo "DROPBOX_REFRESH_TOKEN=test_refresh_token" >> /app/.env \
    && echo "FRONTEND_ORIGIN=http://localhost:4200" >> /app/.env

# Use a shell wrapper to capture startup errors
COPY <<-EOT /app/startup.sh
#!/bin/bash
set -e
echo "Starting ImagesAPI application..."
echo "Current directory: $(pwd)"
echo "Files in directory:"
ls -la
echo "Library path: $LD_LIBRARY_PATH"
echo "Environment variables:"
env | sort
echo "Checking native library:"
if [ -f /app/libImagesProcessor.so ]; then
    echo "Native library exists."
    file /app/libImagesProcessor.so
else
    echo "Native library is missing!"
fi
echo "Starting application..."
# Run with exec to ensure proper signal handling
exec dotnet ImagesAPI.dll
EOT

RUN chmod +x /app/startup.sh

# Use the startup script as entrypoint
ENTRYPOINT ["/app/startup.sh"]
