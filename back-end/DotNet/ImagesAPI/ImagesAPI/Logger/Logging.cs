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

        /// <summary>
        /// Gets the singleton instance of the Logger class.
        /// </summary>
        public static Logging Instance => _instance ??= new Logging();

        /// <summary>
        /// Initializes a new instance of the Logger class.
        /// </summary>
        private Logging()
        {
            string executingAssemblyPath = Assembly.GetExecutingAssembly().Location;

            // Get the directory where the executable is located
            executingAssemblyPath = Path.GetDirectoryName(executingAssemblyPath) ?? string.Empty;

            string logDirectory = Path.Combine(executingAssemblyPath, "ImagesProcessorLogs");
            _logFile = Path.Combine(logDirectory, "ImagesAPI.log");

            if (!Directory.Exists(logDirectory))
            {
                Directory.CreateDirectory(logDirectory);
            }

            if (!File.Exists(_logFile))
            {
                File.Create(_logFile).Dispose();
            }

            LogMessage("Logger initialized.");
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
            if (string.IsNullOrWhiteSpace(_logFile))
            {
                throw new InvalidOperationException("Log file path is not set.");
            }

            lock (_lock)
            {
                using StreamWriter writer = new(_logFile, true) { AutoFlush = true };
                writer.WriteLine($"{{{level}}} {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}");
            }
        }
    }
}
