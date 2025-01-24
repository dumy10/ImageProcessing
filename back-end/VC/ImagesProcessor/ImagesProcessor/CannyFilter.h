#pragma once
#include "IFilter.h"
#include <cmath>
#include <vector>
#include <algorithm>

constexpr float M_PI = 3.14159265358979323846f;

/**
 * @brief A filter that applies the Canny edge detection algorithm to an image.
 *
 * This class implements the IFilter interface to provide edge detection
 * using the Canny operator with multiple processing steps.
 */
class CannyFilter : public IFilter
{
public:
	/**
	* @brief Applies the Canny filter to an image.
	*
	* This method applies the Canny edge detection algorithm to the input image
	 * and stores the result in the output image.
	*
	* @param inputImage Pointer to the input image data.
	* @param outputImage Pointer to the output image data.
	* @param width Width of the image.
	* @param height Height of the image.
	* @param channels Number of color channels in the image.
	*/
	void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const override;

private:
	/**
	* @brief Applies a Gaussian blur to the input image.
	*
	* This method applies a 3x3 Gaussian blur to the input image to reduce noise.
	*
	* @param inputImage Pointer to the input image data.
	* @param width Width of the image.
	* @param height Height of the image.
	* @return std::vector<unsigned char> The blurred image data.
	*/
	[[nodiscard]] std::vector<unsigned char> ApplyGaussianBlur(const unsigned char* inputImage, int width, int height) const;

	/**
	* @brief Calculates the gradients of the input image.
	*
	* This method calculates the gradient magnitude and direction using the Sobel operator.
	*
	* @param inputImage Pointer to the input image data.
	* @param gradientMagnitude Pointer to the gradient magnitude data.
	* @param gradientDirection Pointer to the gradient direction data.
	* @param width Width of the image.
	* @param height Height of the image.
	*/
	void CalculateGradients(const unsigned char* inputImage, float* gradientMagnitude, float* gradientDirection, int width, int height) const;

	/**
	 * @brief Applies non-maximum suppression to the gradient magnitudes.
	 *
	 * This method suppresses non-maximum pixels to thin out the edges.
	 *
	 * @param gradientMagnitude Pointer to the gradient magnitude data.
	 * @param gradientDirection Pointer to the gradient direction data.
	 * @param width Width of the image.
	 * @param height Height of the image.
	 * @return std::vector<unsigned char> The non-maximum suppressed image data.
	 */
	[[nodiscard]] std::vector<unsigned char> NonMaximumSuppression(const float* gradientMagnitude, const float* gradientDirection, int width, int height) const;

	/**
	 * @brief Applies edge tracking by hysteresis to the non-maximum suppressed image.
	 *
	 * This method applies double thresholding and edge tracking to finalize the edges.
	 *
	 * @param inputImage Pointer to the non-maximum suppressed image data.
	 * @param width Width of the image.
	 * @param height Height of the image.
	 * @return std::vector<unsigned char> The final edge-detected image data.
	 */
	[[nodiscard]] std::vector<unsigned char> Hysteresis(const unsigned char* inputImage, int width, int height) const;
};