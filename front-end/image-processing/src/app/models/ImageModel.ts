/**
 * Interface representing an image model.
 */
export interface ImageModel {
  /**
   * Unique identifier for the image.
   * @type {string}
   */
  id: string;

  /**
   * Name of the image.
   * @type {string}
   */
  name: string;

  /**
   * URL where the image is stored.
   * @type {string}
   */
  url: string;

  /**
   * The base64 encoded image data, if available.
   * @type {string | undefined}
   */
  base64Data: string | undefined;

  /**
   * Identifier of the parent image, if any.
   * @type {string | undefined}
   */
  parentId: string | undefined;

  /**
   * URL of the parent image, if any.
   * @type {string | undefined}
   */
  parentUrl: string | undefined;

  /**
   * The base64 encoded data of the parent image, if any.
   * @type {string | undefined}
   */
  parentBase64Data: string | undefined;

  /**
   * Width of the image in pixels.
   * @type {number}
   */
  width: number;

  /**
   * Height of the image in pixels.
   * @type {number}
   */
  height: number;

  /**
   * The MIME type of the image.
   * @type {string | undefined}
   */
  contentType?: string;

  /**
   * List of filters applied to the image.
   * @type {string[] | undefined}
   */
  appliedFilters?: string[];

  /**
   * Flag indicating if the image has been loaded.
   * @type {boolean | undefined}
   */
  loaded?: boolean;
}
