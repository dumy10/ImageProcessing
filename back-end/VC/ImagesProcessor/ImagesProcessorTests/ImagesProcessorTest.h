#pragma once
#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include "ImagesProcessor.h"
#include "Logger.h"
#include <vector>
#include <mutex>
#include <set>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <memory>

// Common test fixture for all ImagesProcessor tests
class ImagesProcessorTest : public ::testing::Test
{
protected:
    void SetUp() override;
    void TearDown() override;

    // Common test utilities
    const std::vector<unsigned char> GetMockImageData(const std::string& extension) const;
    
    // Progress callback tracking for tests
    static void ProgressCallbackTracker(int progress);
    
    // Reset progress tracking data
    void ResetProgressTracking();
    
    // Progress tracking data
    static std::vector<int> progressValues;
    static std::mutex progressMutex;
};