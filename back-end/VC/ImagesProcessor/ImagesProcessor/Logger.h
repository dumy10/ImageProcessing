#pragma once
#include "pch.h"

/**
 * @brief Logger class for logging messages, warnings, and errors.
 */
class Logger
{
public:
	/**
	 * @brief Gets the singleton instance of the Logger.
	 *
	 * @return The singleton instance of the Logger.
	 */
	static Logger& GetInstance();

	/**
	 * @brief Logs a message.
	 *
	 * @param message The message to log.
	 */
	void LogMessage(const std::string& message);

	/**
	 * @brief Logs a warning.
	 *
	 * @param message The warning message to log.
	 */
	void LogWarning(const std::string& message);

	/**
	 * @brief Logs an error.
	 *
	 * @param message The error message to log.
	 */
	void LogError(const std::string& message);

	// Delete copy and move constructors and assignment operators
	Logger(const Logger&) = delete; // Copy constructor
	Logger& operator=(const Logger&) = delete; // Copy assignment operator
	Logger& operator=(Logger&&) = delete; // Move assignment operator
	Logger(Logger&&) = delete; // Move constructor

	/**
	* @brief Public destructor required for unique_ptr.
	*/
	~Logger();

private:
	/**
	 * @brief Private constructor to prevent instantiation.
	 */
	Logger();

	/**
	 * @brief Gets the local time.
	 *
	 * @return The local time as a std::tm structure.
	 */
	static std::tm GetLocalTime();

	/**
	 * @brief Writes a log message to the log file.
	 *
	 * @param level The log level (INFO, WARN, ERROR).
	 * @param message The message to log.
	 */
	void WriteLog(const std::string& level, const std::string& message);

	static std::ofstream m_logFile; ///< Log file stream.
	static std::mutex m_mutex; ///< Mutex for thread-safe logging.
	static std::unique_ptr<Logger> m_instance; ///< Singleton instance of the Logger.
	static std::once_flag m_onceFlag; ///< Flag for creating the singleton instance.
};