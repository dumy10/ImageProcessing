# Image Processing Frontend

This Angular application provides a user interface for the ImageProcessing project, allowing users to upload, view, edit and apply various filters to images.

## Features

- Modern user interface built with Angular 19 and Angular Material
- Image upload and management
- Filter application with real-time preview
- Filter history tracking and visualization
- Image hierarchy view showing filter relationships
- Gallery view for comparing filtered images

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Angular CLI 19.x or higher

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   
   The application uses environment files generated from a `.env` file. Create a `.env` file in the root directory with the following variables:
   ```
   API_URL=http://localhost:5000
   API_KEY=your_api_key_here
   PROD_API_URL=https://your-production-api-url.com
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   
   This will:
   - Generate the environment files based on your `.env` configuration
   - Start the Angular development server
   
4. Navigate to `http://localhost:4200/` in your browser.

## Environment Configuration

The project uses a `config-env.js` script to generate environment configuration files:

- `environment.ts` - For development
- `environment.prod.ts` - For production

When you run `npm start`, these files are automatically generated based on your `.env` file. If no `.env` file is found, default values are used.

## Building for Production

Run `npm run build` to build the project for production. This will:
- Generate production environment files
- Build the project with optimized settings
- Store the build artifacts in the `dist/` directory

## Code Organization

The frontend is organized into several key components:

- **Gallery Component**: Displays and manages a collection of images
- **Edit Image Component**: Provides the image editing interface
- **Filter Sidebar**: Contains the available filters that can be applied
- **Image Hierarchy**: Visual representation of filter history and relationships
- **Image Tree View**: Visual representation of filter history and relationships

## Testing

- **Unit Tests**: Run `ng test` to execute unit tests via Karma

## Performance Considerations

The application implements:
- Lazy loading of images and components
- Client-side caching where appropriate
- Progressive loading indicators for filter operations
- Progressive loading indicators for image upload

## API Integration

The frontend communicates with the backend .NET API for image processing operations. Connection settings can be configured in the environment files.

## Further Help

For additional help on the Angular CLI, use `ng help` or check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
