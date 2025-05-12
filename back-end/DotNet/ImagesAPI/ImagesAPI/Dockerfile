FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
# Set timezone and disable interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

WORKDIR /app
EXPOSE 80
EXPOSE 443
EXPOSE 8080
EXPOSE 10000

# Install dependencies in a single command to reduce layers
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        apt-utils \
        apt-transport-https \
        ca-certificates \
        tzdata \
        # Basic font and image libraries
        libfontconfig1 \
        libfreetype6 \
        libjpeg62 \
        libpng16-16 \
        # Parallel processing libraries
        libgomp1 \
        # Diagnostic tools
        strace \
        file \
        procps \
        curl \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/lib/x86_64-linux-gnu/libfontconfig.so.1 /usr/lib/x86_64-linux-gnu/libfontconfig.so || true \
    && ln -sf /usr/lib/x86_64-linux-gnu/libfreetype.so.6 /usr/lib/x86_64-linux-gnu/libfreetype.so || true

# Set environment variables for SkiaSharp native library loading
ENV SKIA_FONTMGR=fontconfig
ENV SKIASHARP_NATIVE_ASSETS_PERSISTED=1
ENV SKIASHARP_VERSION=3.116.1

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
ENV SKIASHARP_VERSION=3.116.1

# Install the minimum required dependencies for building
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        apt-utils \
        apt-transport-https \
        ca-certificates \
        tzdata \
        # Basic development libraries
        libc6-dev \
        libfontconfig1-dev \
        libfreetype6-dev \
        libjpeg62-dev \
        libpng-dev \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/lib/x86_64-linux-gnu/libfontconfig.so.1 /usr/lib/x86_64-linux-gnu/libfontconfig.so || true \
    && ln -sf /usr/lib/x86_64-linux-gnu/libfreetype.so.6 /usr/lib/x86_64-linux-gnu/libfreetype.so || true

WORKDIR /src

# Copy the native library from cpp-build
COPY --from=cpp-build /build-output/libImagesProcessor.so /src/

# Restore dependencies first
COPY ["back-end/DotNet/ImagesAPI/ImagesAPI/ImagesAPI.csproj", "ImagesAPI/"]
RUN dotnet restore "ImagesAPI/ImagesAPI.csproj" \
    # Pin SkiaSharp version 
    && dotnet add ImagesAPI/ImagesAPI.csproj package SkiaSharp --version ${SKIASHARP_VERSION} \
    && dotnet add ImagesAPI/ImagesAPI.csproj package SkiaSharp.NativeAssets.Linux --version ${SKIASHARP_VERSION} \
    && dotnet restore "ImagesAPI/ImagesAPI.csproj"

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

# Initialize LD_LIBRARY_PATH 
ENV LD_LIBRARY_PATH="/app"

# Set the environment variable to indicate Docker environment
ENV RUNNING_IN_DOCKER=true

# Set default ASPNETCORE_URLS to a single port
ENV ASPNETCORE_URLS=http://+:8080

# Additional settings to help with native library loading
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
ENV SKIASHARP_VERSION=3.116.1

# Use a shell wrapper to capture startup errors and handle environment variables
COPY <<-EOT /app/startup.sh
#!/bin/bash
set -e

# Handle URL configuration - ensure we don't have duplicate ports
if [ ! -z "\$PORT" ]; then
  # For hosting platforms that provide PORT environment variable
  export ASPNETCORE_URLS="http://+:\$PORT"
  echo "Setting ASPNETCORE_URLS to \$ASPNETCORE_URLS"
else 
  echo "Using default ASPNETCORE_URLS: \$ASPNETCORE_URLS"
fi

echo "Starting ImagesAPI application..."
echo "Current directory: \$(pwd)"
echo "Library path: \$LD_LIBRARY_PATH"
echo "URLs: \$ASPNETCORE_URLS"

# Run with exec to ensure proper signal handling
exec dotnet ImagesAPI.dll
EOT

RUN chmod +x /app/startup.sh

# Use the startup script as entrypoint
ENTRYPOINT ["/app/startup.sh"]
