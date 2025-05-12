# ImageProcessing

An advanced image processing application with a variety of filters and real-time processing capabilities.

## Project Overview

ImageProcessing is a comprehensive solution for applying various image filters and transformations with a focus on performance and usability. The project consists of multiple components working together:

1. **C++ Image Processing Library**: A high-performance native library that provides various image filters and transformations
2. **.NET API**: A backend service that interfaces with the native library and exposes RESTful endpoints
3. **Angular Frontend**: A modern web application for uploading, viewing, and applying filters to images

## Features

- Support for multiple image formats (PNG, JPG, JPEG)
- Variety of filters including:
  - Basic transformations (Grayscale, Invert, Blur)
  - Edge detection (Sobel, Canny)
  - Artistic effects (Sepia, Oil Paint, Mosaic, Glitch, Kaleidoscope)
  - Geometric transformations (Horizontal/Vertical Flip)
- Real-time filter preview and application
- Filter history tracking
- Responsive web interface

## Architecture

The project follows a layered architecture:

- **Frontend**: Angular 19 web application
- **Backend**: .NET 8 API with SignalR for real-time updates
- **Processing Engine**: C++ library with OpenMP optimization for parallel processing

## Getting Started

### Environment Setup

1. **Backend Configuration**:
   - Create a `.env` file in `back-end/DotNet/ImagesAPI/ImagesAPI/` based on `.env.example`
   - Fill in required Dropbox and MongoDB settings

2. **Frontend Configuration**:
   - Create a `.env` file in `front-end/image-processing/` with:
     ```
     API_URL=http://localhost:5000
     API_KEY=your_api_key_here
     PROD_API_URL=https://your-production-api-url.com
     ```

### Building and Running

1. Build the C++ library first (see [C++ Library Documentation](./back-end/VC/README.MD))
2. Set up and start the .NET API (see [.NET API Documentation](./back-end/DotNet/README.md))
3. Run the Angular frontend:
   ```
   cd front-end/image-processing
   npm install
   npm start
   ```

See the individual component READMEs for detailed setup instructions:

- [Frontend Documentation](./front-end/image-processing/README.md)
- [.NET API Documentation](./back-end/DotNet/README.md)
- [C++ Library Documentation](./back-end/VC/README.MD)

## Deployment

The application can be deployed using Docker containers or directly on Windows servers. See the `render.yaml` file for cloud deployment configuration.

## License

Copyright © 2025