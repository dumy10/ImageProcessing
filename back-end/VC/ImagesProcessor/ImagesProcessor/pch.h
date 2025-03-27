// pch.h: This is a precompiled header file.
// Files listed below are compiled only once, improving build performance for future builds.
// This also affects IntelliSense performance, including code completion and many code browsing features.
// However, files listed here are ALL re-compiled if any one of them is updated between builds.
// Do not add files here that you will be updating frequently as this negates the performance advantage.

#ifndef PCH_H
#define PCH_H

// add headers that you want to pre-compile here
#include "framework.h"

// Library needed headers
#include "libdefine.h"

// Enum headers
#include "EAllowedExtensions.h"
#include "EDefinedFilters.h"

// C++ needed headers
#include <algorithm>
#include <cmath>
#include <execution>
#include <functional>
#include <memory>
#include <numeric>
#include <queue>
#include <random>
#include <stack>
#include <unordered_map>
#include <vector>
#include <array>

// Logger needed headers
#include <chrono>
#include <ctime>
#include <filesystem>
#include <fstream>
#include <mutex>

// Include the Logger Singleton class in every component that includes the precompiled header
#include "Logger.h"


#endif //PCH_H
