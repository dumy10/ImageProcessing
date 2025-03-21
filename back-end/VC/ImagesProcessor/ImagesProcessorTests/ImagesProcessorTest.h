#pragma once
#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include "ImagesProcessor.h"
#include "Logger.h"

class ImagesProcessorTest : public ::testing::Test
{
protected:
	void SetUp() override;
	void TearDown() override;

	const std::vector<unsigned char> GetMockImageData(const std::string& extension) const;
};