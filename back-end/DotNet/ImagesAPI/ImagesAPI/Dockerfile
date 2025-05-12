FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
# Set timezone and disable interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

WORKDIR /app
# Update port exposure to include 8080 and 10000 (Render's internal health check port)
EXPOSE 80
EXPOSE 443
EXPOSE 8080
EXPOSE 10000

# Update package lists and install minimum required dependencies first
RUN apt-get update && \
    apt-get install -y --no-install-recommends apt-utils apt-transport-https ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install SkiaSharp dependencies in smaller batches to isolate potential issues
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        tzdata \
        libfontconfig1 \
        libfreetype6 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install graphics libraries individually to isolate potential issues
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y --no-install-recommends libgif7 || apt-get install -y --no-install-recommends libgif && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y --no-install-recommends libpng16-16 || apt-get install -y --no-install-recommends libpng || \
    apt-get install -y --no-install-recommends libpng-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y --no-install-recommends libjpeg-turbo8 || apt-get install -y --no-install-recommends libjpeg-turbo || \
    apt-get install -y --no-install-recommends libjpeg && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install parallel processing libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libgomp1 \
        libtbb2 || apt-get install -y --no-install-recommends libtbb-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install additional SkiaSharp dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libicu-dev || apt-get install -y --no-install-recommends libicu70 || apt-get install -y --no-install-recommends libicu67 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
    
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libharfbuzz-dev || apt-get install -y --no-install-recommends libharfbuzz0b \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
    
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libdbus-1-3 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install X11 dependencies and diagnostic tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libsm6 \
        libxext6 \
        libxrender1 \
        libc-bin \
        strace \
        file \
        procps \
        curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create required symbolic links
RUN ln -sf /usr/lib/x86_64-linux-gnu/libfontconfig.so.1 /usr/lib/x86_64-linux-gnu/libfontconfig.so || true && \
    ln -sf /usr/lib/x86_64-linux-gnu/libfreetype.so.6 /usr/lib/x86_64-linux-gnu/libfreetype.so || true

# Set environment variables for SkiaSharp native library loading
ENV SKIA_FONTMGR=fontconfig
# Make sure SkiaSharp knows we're using its Linux assets
ENV SKIASHARP_NATIVE_ASSETS_PERSISTED=1
# Set SkiaSharp version compatibility
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
# Set SkiaSharp version for the build environment
ENV SKIASHARP_VERSION=3.116.1

# Install base development dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        apt-utils \
        apt-transport-https \
        ca-certificates \
        tzdata \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install C development libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libc6-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install font dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libfontconfig1-dev || apt-get install -y --no-install-recommends libfontconfig-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libfreetype6-dev || apt-get install -y --no-install-recommends libfreetype-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install graphics libraries individually with fallbacks
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1-mesa-dev || apt-get install -y --no-install-recommends libgl-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y --no-install-recommends libglib2.0-dev || apt-get install -y --no-install-recommends libglib2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y --no-install-recommends libpng-dev || apt-get install -y --no-install-recommends libpng16-16 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y --no-install-recommends libgif-dev || apt-get install -y --no-install-recommends libgif7 || apt-get install -y --no-install-recommends libgif \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install JPEG libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libjpeg-turbo8 || apt-get install -y --no-install-recommends libjpeg-turbo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libjpeg-turbo8-dev || apt-get install -y --no-install-recommends libjpeg-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install additional text rendering libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libicu-dev || apt-get install -y --no-install-recommends libicu70 || apt-get install -y --no-install-recommends libicu67 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libharfbuzz-dev || apt-get install -y --no-install-recommends libharfbuzz0b \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create required symbolic links
RUN ln -sf /usr/lib/x86_64-linux-gnu/libfontconfig.so.1 /usr/lib/x86_64-linux-gnu/libfontconfig.so || true && \
    ln -sf /usr/lib/x86_64-linux-gnu/libfreetype.so.6 /usr/lib/x86_64-linux-gnu/libfreetype.so || true

WORKDIR /src

# Copy the native library from cpp-build - place it in the build tree before starting the build
COPY --from=cpp-build /build-output/libImagesProcessor.so /src/

# Restore dependencies first
COPY ["back-end/DotNet/ImagesAPI/ImagesAPI/ImagesAPI.csproj", "ImagesAPI/"]
RUN dotnet restore "ImagesAPI/ImagesAPI.csproj" \
    # Pin SkiaSharp version to ensure compatibility
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

# Initialize LD_LIBRARY_PATH and set the library path
ENV LD_LIBRARY_PATH=""
ENV LD_LIBRARY_PATH=/app:${LD_LIBRARY_PATH}

# Set the environment variable to indicate Docker environment
ENV RUNNING_IN_DOCKER=true

# Set default ASPNETCORE_URLS to a single port (will be overridden by startup script)
ENV ASPNETCORE_URLS=http://+:8080

# Additional settings to help with native library loading
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
# Ensure SkiaSharp uses the correct version of native libraries
ENV SKIASHARP_VERSION=3.116.1

# Use a shell wrapper to capture startup errors and handle environment variables
COPY <<-EOT /app/startup.sh
#!/bin/bash
set -e

# Handle URL configuration - ensure we don't have duplicate ports
# Render is specifically setting ASPNETCORE_URLS to "http://+:10000;http://+:10000" which causes conflicts
if [ ! -z "\$ASPNETCORE_URLS" ]; then
  # Clean up any duplicate URLs that may be in the environment
  CLEAN_URLS=""
  
  # Split the URLs by semicolon and deduplicate
  IFS=';' read -ra URL_ARRAY <<< "\$ASPNETCORE_URLS"
  declare -A SEEN_URLS
  
  for url in "\${URL_ARRAY[@]}"; do
    # Skip empty URLs
    if [ -z "\$url" ]; then
      continue
    fi
    
    # Only add each unique URL once
    if [ -z "\${SEEN_URLS[\$url]}" ]; then
      if [ -z "\$CLEAN_URLS" ]; then
        CLEAN_URLS="\$url"
      else
        CLEAN_URLS="\$CLEAN_URLS;\$url"
      fi
      SEEN_URLS[\$url]=1
    fi
  done
  
  # If Render provides PORT, ensure we're using that
  if [ ! -z "\$PORT" ]; then
    # For Render, just use a single port for simplicity
    export ASPNETCORE_URLS="http://+:\$PORT"
  else
    # Use the cleaned up URLs
    export ASPNETCORE_URLS="\$CLEAN_URLS"
  fi
  
  echo "Setting ASPNETCORE_URLS to \$ASPNETCORE_URLS"
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
