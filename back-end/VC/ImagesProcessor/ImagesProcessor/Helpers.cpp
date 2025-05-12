#include "pch.h"
#include "Helpers.h"

void ReportProgressIfNeeded(const ProgressCallback& progressCallback, int progress)
{
	if (progressCallback)
	{
		progressCallback(progress);
	}
}

std::string ToLowerCase(const std::string& input)
{
	std::string result = input;
	std::transform(result.begin(), result.end(), result.begin(),
		[](unsigned char c) { return std::tolower(c); });
	return result;
}

bool IsValidPointer(void* pointer)
{
#if defined(_WIN32) || defined(_WIN64)
	// Windows-specific pointer validation
	if (pointer == nullptr)
		return false;

	MEMORY_BASIC_INFORMATION mbi;
	if (VirtualQuery(pointer, &mbi, sizeof(mbi)) == 0)
		return false;

	if (mbi.State != MEM_COMMIT)
		return false;

	return true;
#else
	// Simple null check for Linux
	return pointer != nullptr;
#endif
}
