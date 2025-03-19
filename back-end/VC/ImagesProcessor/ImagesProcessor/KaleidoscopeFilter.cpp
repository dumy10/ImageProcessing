#include "pch.h"
#include "KaleidoscopeFilter.h"
#include <omp.h>

void KaleidoscopeFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels) const
{
	Logger::GetInstance().LogMessage("Applying kaleidoscope filter");

	const int centerX = width / 2;
	const int centerY = height / 2;
	const int numReflections = 6;  // Number of mirrored segments (adjustable for different effects)

#pragma warning(push) 
#pragma warning(disable: 6993) // The Code Analyzer doesn't understand the OpenMP pragma and generates a warning
#pragma omp parallel for schedule(dynamic) // Use dynamic scheduling for better load balancing
	for (int y = 0; y < height; ++y)
	{
		for (int x = 0; x < width; x++)
		{
			float dx = static_cast<float>(x - centerX);
			float dy = static_cast<float>(y - centerY);
			float angle = atan2f(dy, dx);
			float radius = sqrtf(dx * dx + dy * dy);

			// Mirror the angle within a symmetrical segment
			float segmentAngle = M_PI / numReflections;
			float mirroredAngle = fmodf(fabsf(angle), segmentAngle) * ((angle < 0) ? -1 : 1);

			// Convert back to Cartesian coordinates
			int mirroredX = static_cast<int>(centerX + radius * cosf(mirroredAngle));
			int mirroredY = static_cast<int>(centerY + radius * sinf(mirroredAngle));

			// Ensure coordinates are within bounds
			mirroredX = std::clamp(mirroredX, 0, width - 1);
			mirroredY = std::clamp(mirroredY, 0, height - 1);

			int srcIndex = (mirroredY * width + mirroredX) * channels;
			int dstIndex = (y * width + x) * channels;

			// Use SIMD-friendly copy
			memcpy(&outputImage[dstIndex], &inputImage[srcIndex], channels);
		}
	}
#pragma warning(pop) // Restore warning settings

	Logger::GetInstance().LogMessage("Kaleidoscope filter applied");
}
