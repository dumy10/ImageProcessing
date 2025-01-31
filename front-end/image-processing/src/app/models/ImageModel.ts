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
   * List of filters applied to the image.
   * @type {string[] | undefined}
   */
  appliedFilters: string[] | undefined;

  /**
   * Flag indicating whether the image has been loaded in the gallery.
   */
  loaded: boolean;
}
