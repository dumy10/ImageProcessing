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
#include "EDefinedFilters.h"
#include "EAllowedExtensions.h"

// C++ needed headers
#include <vector>
#include <map>
#include <memory>

// Logger needed headers
#include <fstream>
#include <filesystem>
#include <mutex>
#include <chrono>
#include <ctime>

// Include the Logger Singleton class in every component that includes the precompiled header
#include "Logger.h"


#endif //PCH_H
