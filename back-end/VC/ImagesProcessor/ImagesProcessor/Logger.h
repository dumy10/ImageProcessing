#pragma once
#include "pch.h"

class Logger
{
public:
	static void LogMessage(const std::string& message);
	static void LogWarning(const std::string& message);
	static void LogError(const std::string& message);

	// Delete copy and move constructors and assignment operators
	Logger(const Logger&) = delete; // Copy constructor
	Logger& operator=(const Logger&) = delete; // Copy assignment operator
	Logger& operator=(Logger&&) = delete; // Move assignment operator
	Logger(Logger&&) = delete; // Move constructor

private:
	Logger(); // Private constructor
	~Logger(); // Private destructor

	static std::tm GetLocalTime();

	static std::ofstream m_logFile;
	static std::mutex m_mutex;
	static Logger* m_instance;
};