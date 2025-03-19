/**
 * Enum representing the different types of image filters that can be applied.
 */
export enum Filters {
  /**
   * Grayscale filter.
   * Converts the image to shades of gray.
   */
  GrayScale = 'grayscale',

  /**
   * Invert filter.
   * Inverts the colors of the image.
   */
  Invert = 'invert',

  /**
   * Blur filter.
   * Applies a blur effect to the image.
   */
  Blur = 'blur',

  /**
   * Sobel filter.
   * Applies the Sobel edge detection filter to the image.
   */
  Sobel = 'sobel',

  /**
   * Canny filter.
   * Applies the Canny edge detection filter to the image.
   */
  Canny = 'canny',

  /**
   * Flip horizontal filter.
   * Flips the image horizontally
   */
  FlipHorizontal = 'flip horizontal',

  /**
   * Flip vertical filter.
   * Flips the image vertically
   */
  FlipVertical = 'flip vertical',

  /**
   * Sepia filter.
   * Applies a sepia effect to the image.
   */
  Sepia = 'sepia',

  /**
   * Oil paint filter.
   * Applies an oil paint effect to the image.
   */
  OilPaint = 'oil paint',

  /**
   * Kaleidoscope filter.
   * Applies a kaleidoscope effect to the image.
   */
  Kaleidoscope = 'kaleidoscope',

  /**
   * Mosaic filter.
   * Applies a mosaic effect to the image.
   */
  Mosaic = 'mosaic',
}
