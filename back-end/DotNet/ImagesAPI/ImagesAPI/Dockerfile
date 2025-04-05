FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
# Set timezone and disable interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

WORKDIR /app
EXPOSE 80
EXPOSE 443

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
    && rm -rf /var/lib/apt/lists/*

# Copy C++ project files
COPY ["back-end/VC/ImagesProcessor", "/src/ImagesProcessor"]

# Build the C++ project using CMake
WORKDIR /src/ImagesProcessor/BUILD
RUN cmake .. \
    && cmake --build . --config Release \
    && mkdir -p /build-output \
    && cp bin/libImagesProcessor.so /build-output/

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

# Make sure permissions are set correctly
RUN chmod +x /app/libImagesProcessor.so

# Set the environment variable to indicate Docker environment
ENV RUNNING_IN_DOCKER=true

ENTRYPOINT ["dotnet", "ImagesAPI.dll"]
