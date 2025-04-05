using System.Reflection;

namespace ImagesAPI.Logger
{
    /// <summary>
    /// Singleton class for logging messages to a file.
    /// </summary>
    public class Logging
    {
        private static readonly object _lock = new();
        private static Logging? _instance = null;
        private static string _logFile = string.Empty;
        private static string _logDirectory = string.Empty;

        /// <summary>
        /// Gets the singleton instance of the Logger class.
        /// </summary>
        public static Logging Instance => _instance ??= new Logging();

        /// <summary>
        /// Initializes a new instance of the Logger class.
        /// </summary>
        private Logging()
        {
            try
            {
                string executingAssemblyPath = Assembly.GetExecutingAssembly().Location;

                // Get the directory where the executable is located
                executingAssemblyPath = Path.GetDirectoryName(executingAssemblyPath) ?? string.Empty;

                _logDirectory = Path.Combine(executingAssemblyPath, "ImagesProcessorLogs");

                // Create a log file for the current execution of the program in order to avoid overwriting logs across different executions
                _logFile = Path.Combine(_logDirectory, $"ImagesAPI-{DateTime.Now:yyyy-MM-dd-HH-mm-ss}.log");

                if (!Directory.Exists(_logDirectory))
                {
                    Directory.CreateDirectory(_logDirectory);
                }

                LogMessage("Logger initialized.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error initializing logger: {ex.Message}");
                // Fallback to Console logging if file logging fails
                _logFile = string.Empty;
            }
        }

        /// <summary>
        /// Logs an informational message.
        /// </summary>
        public void LogMessage(string message) => WriteLog("INFO", message);

        /// <summary>
        /// Logs a warning message.
        /// </summary>
        public void LogWarning(string message) => WriteLog("WARN", message);

        /// <summary>
        /// Logs an error message.
        /// </summary>
        public void LogError(string message) => WriteLog("ERROR", message);

        /// <summary>
        /// Generic method to write logs.
        /// </summary>
        private static void WriteLog(string level, string message)
        {
            string logMessage = $"{{{level}}} {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}";

            if (string.IsNullOrWhiteSpace(_logFile) || string.IsNullOrWhiteSpace(_logDirectory))
            {
                return; // Skip file logging if paths not set
            }

            // We'll try to log to file, but won't fail the application if we can't
            try
            {
                lock (_lock)
                {
                    // Use FileShare.ReadWrite to allow concurrent access
                    using var fs = new FileStream(_logFile, FileMode.Append, FileAccess.Write, FileShare.ReadWrite);
                    using var writer = new StreamWriter(fs) { AutoFlush = true };
                    writer.WriteLine(logMessage);
                }
            }
            catch (IOException ex)
            {
                // If the current log file is being used, create a new one with a unique timestamp
                try
                {
                    if (!string.IsNullOrEmpty(_logDirectory))
                    {
                        _logFile = Path.Combine(_logDirectory, $"ImagesAPI-{DateTime.Now:yyyy-MM-dd-HH-mm-ss-fff}.log");
                        using var fs = new FileStream(_logFile, FileMode.Create, FileAccess.Write, FileShare.ReadWrite);
                        using var writer = new StreamWriter(fs) { AutoFlush = true };
                        writer.WriteLine($"{{INFO}} {DateTime.Now:yyyy-MM-dd HH:mm:ss} - Created new log file due to access issue with previous file.");
                        writer.WriteLine(logMessage);
                    }
                }
                catch
                {
                    // If we still can't write to a file, give up on file logging but don't crash the app
                    Console.WriteLine($"Failed to create new log file after IO exception: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                // Log any other exceptions to console but don't crash the application
                Console.WriteLine($"Error writing to log file: {ex.Message}");
            }
        }
    }
}
