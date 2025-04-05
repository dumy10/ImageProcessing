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

# Initialize LD_LIBRARY_PATH and set the library path
ENV LD_LIBRARY_PATH=""
ENV LD_LIBRARY_PATH=/app:${LD_LIBRARY_PATH}

# Set the environment variable to indicate Docker environment
ENV RUNNING_IN_DOCKER=true

# Set default ASPNETCORE_URLS to a single port (will be overridden by startup script)
ENV ASPNETCORE_URLS=http://+:8080

# Additional settings to help with native library loading
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

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
