#pragma once
#include "pch.h"

/**
 * @brief Logger class for logging messages, warnings, and errors.
 */
class Logger
{
public:
    /**
     * @brief Logs a message.
     * 
     * @param message The message to log.
     */
    static void LogMessage(const std::string& message);

    /**
     * @brief Logs a warning.
     * 
     * @param message The warning message to log.
     */
    static void LogWarning(const std::string& message);

    /**
     * @brief Logs an error.
     * 
     * @param message The error message to log.
     */
    static void LogError(const std::string& message);

    // Delete copy and move constructors and assignment operators
    Logger(const Logger&) = delete; // Copy constructor
    Logger& operator=(const Logger&) = delete; // Copy assignment operator
    Logger& operator=(Logger&&) = delete; // Move assignment operator
    Logger(Logger&&) = delete; // Move constructor

private:
    /**
     * @brief Private constructor to prevent instantiation.
     */
    Logger();

    /**
     * @brief Private destructor to prevent deletion.
     */
    ~Logger();

    /**
     * @brief Gets the local time.
     * 
     * @return The local time as a std::tm structure.
     */
    static std::tm GetLocalTime();

    static std::ofstream m_logFile; ///< Log file stream.
    static std::mutex m_mutex; ///< Mutex for thread-safe logging.
    static Logger* m_instance; ///< Singleton instance of the Logger.
};