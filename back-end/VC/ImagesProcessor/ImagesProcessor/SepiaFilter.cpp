#include "pch.h"
#include "SepiaFilter.h"

void SepiaFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying sepia filter");

	const float sepiaMatrix[3][3] = {
		{0.393f, 0.769f, 0.189f}, // Coefficients for the red channel
		{0.349f, 0.686f, 0.168f}, // Coefficients for the green channel
		{0.272f, 0.534f, 0.131f}  // Coefficients for the blue channel
	};

	const int size = width * height * channels;
	for (int i = 0; i < size; i += channels)
	{
		float r = inputImage[i];
		float g = inputImage[i + 1];
		float b = inputImage[i + 2];

		// Apply the sepia transformation
		float newR = (r * sepiaMatrix[0][0]) + (g * sepiaMatrix[0][1]) + (b * sepiaMatrix[0][2]);
		float newG = (r * sepiaMatrix[1][0]) + (g * sepiaMatrix[1][1]) + (b * sepiaMatrix[1][2]);
		float newB = (r * sepiaMatrix[2][0]) + (g * sepiaMatrix[2][1]) + (b * sepiaMatrix[2][2]);

		// Clamp the values to the valid range [0, 255]
		outputImage[i] = static_cast<unsigned char>(std::min<float>(newR, 255.0f));
		outputImage[i + 1] = static_cast<unsigned char>(std::min<float>(newG, 255.0f));
		outputImage[i + 2] = static_cast<unsigned char>(std::min<float>(newB, 255.0f));
	}

	Logger::GetInstance().LogMessage("Sepia filter applied");
}
