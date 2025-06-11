using ImagesAPI.Models;
using SkiaSharp;

namespace ImagesAPI.Validators
{
    /// <summary>
    /// Validator for image upload operations
    /// </summary>
    public class ImageUploadValidator
    {
        private const int MAX_IMAGE_SIZE = 1024 * 1024 * 10; // 10 MB

        /// <summary>
        /// Validates the uploaded file
        /// </summary>
        /// <param name="image">The uploaded file</param>
        /// <returns>Validation result</returns>
        public ImageValidationResult ValidateFile(IFormFile? image)
        {
            if (image == null || image.Length == 0)
            {
                return ImageValidationResult.Failure("No file uploaded.");
            }

            if (image.Length > MAX_IMAGE_SIZE)
            {
                return ImageValidationResult.Failure("File size exceeds the limit.");
            }

            return ImageValidationResult.Success();
        }

        /// <summary>
        /// Validates the image format and content
        /// </summary>
        /// <param name="memoryStream">The image data stream</param>
        /// <returns>Validation result with image information</returns>
        public ImageValidationResult ValidateImageContent(MemoryStream memoryStream)
        {
            memoryStream.Position = 0;
            
            using var skData = SKData.Create(memoryStream);
            using var skCodec = SKCodec.Create(skData);
            
            if (skCodec == null)
            {
                return ImageValidationResult.Failure("Invalid or corrupted image file.");
            }

            var imageFormat = skCodec.EncodedFormat.ToString().ToUpper();
            if (!Enum.TryParse<EAllowedExtensions>(imageFormat, out _))
            {
                return ImageValidationResult.Failure($"Invalid file type: {imageFormat}. Allowed types: JPEG, JPG, PNG.");
            }

            memoryStream.Position = 0;
            using var skImage = SKImage.FromEncodedData(skData);
            
            if (skImage == null)
            {
                return ImageValidationResult.Failure("Invalid image file.");
            }

            return ImageValidationResult.Success(skImage.Width, skImage.Height);
        }

        /// <summary>
        /// Validates a filter name
        /// </summary>
        /// <param name="filter">The filter to validate</param>
        /// <returns>Validation result with normalized filter name</returns>
        public FilterValidationResult ValidateFilter(string filter)
        {
            if (string.IsNullOrWhiteSpace(filter))
            {
                return FilterValidationResult.Failure("Filter cannot be empty.");
            }

            // Normalize filter name
            string normalizedFilter = filter.Replace(" ", string.Empty).ToLower();

            if (!Enum.TryParse<EAllowedFilters>(normalizedFilter.ToUpper(), out _))
            {
                return FilterValidationResult.Failure($"The filter {filter} is not accepted. Please try again.");
            }

            return FilterValidationResult.Success(normalizedFilter);
        }
    }

    /// <summary>
    /// Result of image validation
    /// </summary>
    public class ImageValidationResult
    {
        public bool IsValid { get; }
        public string ErrorMessage { get; }
        public int Width { get; }
        public int Height { get; }

        private ImageValidationResult(bool isValid, string errorMessage = "", int width = 0, int height = 0)
        {
            IsValid = isValid;
            ErrorMessage = errorMessage;
            Width = width;
            Height = height;
        }

        public static ImageValidationResult Success(int width = 0, int height = 0) => new(true, "", width, height);

        public static ImageValidationResult Failure(string errorMessage) => new(false, errorMessage);
    }

    /// <summary>
    /// Result of filter validation
    /// </summary>
    public class FilterValidationResult
    {
        public bool IsValid { get; }
        public string ErrorMessage { get; }
        public string NormalizedFilter { get; }

        private FilterValidationResult(bool isValid, string errorMessage = "", string normalizedFilter = "")
        {
            IsValid = isValid;
            ErrorMessage = errorMessage;
            NormalizedFilter = normalizedFilter;
        }

        public static FilterValidationResult Success(string normalizedFilter) => new(true, "", normalizedFilter);

        public static FilterValidationResult Failure(string errorMessage) => new(false, errorMessage);
    }
}
