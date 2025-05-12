#pragma once
#include "IFilter.h"

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
     * @param progressCallback Optional callback function for progress updates.
     */
    void Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, const ProgressCallback& progressCallback = nullptr) const override;

private:
    /**
     * @brief Applies Gaussian blur to reduce noise in the image.
     *
     * This method smooths the input image using a Gaussian filter to minimize the effect of noise.
     *
     * @param inputImage Pointer to the input image data.
     * @param outputImage Pointer to the blurred image data.
     * @param width Width of the image.
     * @param height Height of the image.
     */
    void ApplyGaussianBlur(const unsigned char* inputImage, unsigned char* outputImage, int width, int height) const;

    /**
     * @brief Calculates the gradient magnitude and direction of the image.
     *
     * Computes the intensity gradients of the image using differential operators.
     *
     * @param inputImage Pointer to the input image data.
     * @param gradientMagnitude Pointer to store the gradient magnitudes.
     * @param gradientDirection Pointer to store the gradient directions.
     * @param width Width of the image.
     * @param height Height of the image.
     */
    void CalculateGradients(const unsigned char* inputImage, float* gradientMagnitude, float* gradientDirection, int width, int height) const;

    /**
     * @brief Performs non-maximum suppression to thin out the edges.
     *
     * This method suppresses pixels that are not part of an edge, keeping only the local maxima.
     *
     * @param gradientMagnitude Pointer to the gradient magnitudes.
     * @param gradientDirection Pointer to the gradient directions.
     * @param outputImage Pointer to store the suppressed image data.
     * @param width Width of the image.
     * @param height Height of the image.
     */
    void NonMaximumSuppression(const float* gradientMagnitude, const float* gradientDirection, unsigned char* outputImage, int width, int height) const;

    /**
     * @brief Applies double thresholding and edge tracking by hysteresis.
     *
     * Identifies strong and weak edges and finalizes the detection by suppressing false edges.
     *
     * @param inputImage Pointer to the non-max suppressed image data.
     * @param outputImage Pointer to store the final edge-detected image data.
     * @param width Width of the image.
     * @param height Height of the image.
     */
    void DoubleThresholdAndHysteresis(const unsigned char* inputImage, unsigned char* outputImage, int width, int height) const;
};