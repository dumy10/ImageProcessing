#include "pch.h"
#include "Logger.h"

std::ofstream Logger::m_logFile;
std::mutex Logger::m_mutex;
std::unique_ptr<Logger> Logger::m_instance;
std::once_flag Logger::m_onceFlag;

Logger& Logger::GetInstance()
{
	std::call_once(m_onceFlag, []() {
		m_instance.reset(new Logger());
		});

	return *m_instance;
}

void Logger::LogMessage(const std::string& message)
{
	WriteLog("INFO", message);
}

void Logger::LogWarning(const std::string& message)
{
	WriteLog("WARN", message);
}

void Logger::LogError(const std::string& message)
{
	WriteLog("ERROR", message);
}

Logger::Logger()
{
	// Get the current path and append the directory name
	std::filesystem::path currentPath = std::filesystem::current_path() / "ImagesProcessorLogs";

	// Create the directory if it does not exist
	if (!std::filesystem::exists(currentPath))
	{
		std::filesystem::create_directory(currentPath);
	}

	// Add the log file name to the path
	currentPath /= "ImagesProcessor.log";

	// If the file already exists, delete it
	if (std::filesystem::exists(currentPath))
	{
		std::filesystem::remove(currentPath);
	}

	// Open the log file (if it does not exist, it will be created)
	m_logFile.open(currentPath, std::ios::out | std::ios::app);

	// Check if the file was opened successfully
	if (!m_logFile.is_open())
	{
		throw std::runtime_error("Could not open log file");
	}

	LogMessage("Logger initialized successfully");
}

Logger::~Logger()
{
	LogMessage("Deleting logger");
	// Close the log file
	if (m_logFile.is_open())
	{
		m_logFile.close();
	}
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

void Logger::WriteLog(const std::string& level, const std::string& message)
{
	// Lock the mutex
	std::lock_guard<std::mutex> lock(m_mutex);

	// Get the current time
	std::tm localTime = Logger::GetLocalTime();

	// Write the log message to the log file
	if (m_logFile.is_open())
	{
		m_logFile << "{" << level << "} " << std::put_time(&localTime, "%Y-%m-%d %H:%M:%S") << " - " << message << std::endl;
	}
}
