#include "pch.h"
#include "KaleidoscopeFilter.h"
#include <omp.h>

#pragma warning(disable : 6993) // Suppress warning about OpenMP not being supported in this configuration

void KaleidoscopeFilter::Apply(const unsigned char* inputImage, unsigned char* outputImage, int width, int height, int channels, const ProgressCallback& progressCallback) const
{
	Logger::GetInstance().LogMessage("Applying kaleidoscope filter");

	ReportProgressIfNeeded(progressCallback, 60);

	static constexpr int numReflections = 6;  // Number of mirrored segments (adjustable for different effects)
	const int centerX = width / 2;
	const int centerY = height / 2;

#pragma omp parallel for schedule(dynamic) // Use dynamic scheduling for better load balancing
	for (int y = 0; y < height; y++)
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

			// Copy pixel data from the mirrored position to the output image
			memcpy(&outputImage[dstIndex], &inputImage[srcIndex], channels);
		}
	}

	ReportProgressIfNeeded(progressCallback, 70);

	Logger::GetInstance().LogMessage("Kaleidoscope filter applied");
}

#pragma warning(default : 6993) // Restore warning about OpenMP not being supported in this configuration