#include "pch.h"
#include "Logger.h"

std::ofstream Logger::m_logFile;
std::mutex Logger::m_mutex;
Logger* Logger::m_instance = nullptr;

void Logger::LogMessage(const std::string& message)
{
	// If the instance does not exist, create it
	if (m_instance == nullptr)
	{
		m_instance = new Logger();
	}

	// Lock the mutex
	std::lock_guard<std::mutex> lock(m_mutex);

	// Get the current time
	std::tm localTime = Logger::GetLocalTime();

	// Write an info message to the log file
	m_logFile << "{INFO} " << std::put_time(&localTime, "%Y-%m-%d %H:%M:%S") << " - " << message << std::endl;
}

void Logger::LogWarning(const std::string& message)
{
	// If the instance does not exist, create it
	if (m_instance == nullptr)
	{
		m_instance = new Logger();
	}

	// Lock the mutex
	std::lock_guard<std::mutex> lock(m_mutex);

	// Get the current time
	std::tm localTime = Logger::GetLocalTime();

	// Write a warning message to the log file
	m_logFile << "{WARN} " << std::put_time(&localTime, "%Y-%m-%d %H:%M:%S") << " - " << message << std::endl;
}

void Logger::LogError(const std::string& message)
{
	// If the instance does not exist, create it
	if (m_instance == nullptr)
	{
		m_instance = new Logger();
	}

	// Lock the mutex
	std::lock_guard<std::mutex> lock(m_mutex);

	// Get the current time
	std::tm localTime = Logger::GetLocalTime();

	// Write an error message to the log file
	m_logFile << "{ERROR} " << std::put_time(&localTime, "%Y-%m-%d %H:%M:%S") << " - " << message << std::endl;
}

Logger::Logger()
{
	// Create a Path to the temp directory
	std::filesystem::path tempPath = std::filesystem::temp_directory_path();

	// Create a directory in the temp directory
	tempPath /= "ImagesProcessor";

	// Create the directory if it does not exist
	if (!std::filesystem::exists(tempPath))
	{
		std::filesystem::create_directory(tempPath);
	}

	// Create a path to the log file
	tempPath /= "ImagesProcessor.log";

	// Open the log file (if it does not exist, it will be created)
	m_logFile.open(tempPath, std::ios::out | std::ios::app);

	// Check if the file was opened successfully
	if (!m_logFile.is_open())
	{
		throw std::runtime_error("Could not open log file");
	}
}

Logger::~Logger()
{
	// Close the log file
	if (m_logFile.is_open())
	{
		m_logFile.close();
	}

	// Delete the instance
	delete m_instance;
	m_instance = nullptr;
}

std::tm Logger::GetLocalTime()
{
	// Get the current time
	std::time_t currentTime = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());

	// Convert time to local time
	std::tm localTime;
	localtime_s(&localTime, &currentTime);

	return localTime;
}