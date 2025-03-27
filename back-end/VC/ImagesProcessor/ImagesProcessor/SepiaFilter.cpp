#include "pch.h"
#include "SepiaFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void SepiaFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying sepia filter");

	static constexpr float sepiaMatrix[3][3] = {
		{0.393f, 0.769f, 0.189f}, // Coefficients for the red channel
		{0.349f, 0.686f, 0.168f}, // Coefficients for the green channel
		{0.272f, 0.534f, 0.131f}  // Coefficients for the blue channel
	};

	const int size = width * height * channels;

#pragma omp parallel for
	for (int i = 0; i < size; i += channels)
	{
		float r = inputImage[i];
		float g = inputImage[i + 1];
		float b = inputImage[i + 2];

		// Apply the sepia transformation
		float newR = (r * sepiaMatrix[0][0]) + (g * sepiaMatrix[0][1]) + (b * sepiaMatrix[0][2]);
		float newG = (r * sepiaMatrix[1][0]) + (g * sepiaMatrix[1][1]) + (b * sepiaMatrix[1][2]);
		float newB = (r * sepiaMatrix[2][0]) + (g * sepiaMatrix[2][1]) + (b * sepiaMatrix[2][2]);

		// Clamp values
		outputImage[i] = static_cast<unsigned char>(std::clamp(newR, 0.0f, 255.0f));
		outputImage[i + 1] = static_cast<unsigned char>(std::clamp(newG, 0.0f, 255.0f));
		outputImage[i + 2] = static_cast<unsigned char>(std::clamp(newB, 0.0f, 255.0f));
	}

	Logger::GetInstance().LogMessage("Sepia filter applied");
}

#pragma warning(default : 6993) // Restore warning about OpenMP not being supported in this configuration
