namespace ImagesAPI.Logger
{
    /// <summary>
    /// Singleton class for logging messages to a file.
    /// </summary>
    public class Logging
    {
        private static Logging? _instance = null;
        private static string _logFile = string.Empty;

        /// <summary>
        /// Gets the singleton instance of the Logger class.
        /// </summary>
        public static Logging Instance
        {
            get
            {
                _instance ??= new Logging();
                return _instance;
            }
        }

        /// <summary>
        /// Initializes a new instance of the Logger class.
        /// </summary>
        private Logging()
        {
            string tempPath = Path.GetTempPath();
            string logDirectory = tempPath + "ImagesAPI";

            if (!Directory.Exists(logDirectory))
            {
                Directory.CreateDirectory(logDirectory);
            }

            string logFile = logDirectory + "/ImagesAPI.log";

            if (!File.Exists(logFile))
            {
                using (File.Create(logFile)) { }
            }

            _logFile = logFile;

            LogMessage("Logger initialized.");
        }

        /// <summary>
        /// Logs an informational message to the log file.
        /// </summary>
        /// <param name="message">The message to log.</param>
        public void LogMessage(string message)
        {
            if (string.IsNullOrWhiteSpace(_logFile))
            {
                throw new InvalidOperationException("Log file path is not set.");
            }

            using StreamWriter writer = new(_logFile, true);
            writer.WriteLine("{INFO} " + $"{DateTime.Now} - {message}");
        }

        /// <summary>
        /// Logs a warning message to the log file.
        /// </summary>
        /// <param name="message">The message to log.</param>
        public void LogWarning(string message)
        {
            if (string.IsNullOrWhiteSpace(_logFile))
            {
                throw new InvalidOperationException("Log file path is not set.");
            }
            using StreamWriter writer = new(_logFile, true);
            writer.WriteLine("{WARN} " + $"{DateTime.Now} - {message}");
        }

        /// <summary>
        /// Logs an error message to the log file.
        /// </summary>
        /// <param name="message">The message to log.</param>
        public void LogError(string message)
        {
            if (string.IsNullOrWhiteSpace(_logFile))
            {
                throw new InvalidOperationException("Log file path is not set.");
            }
            using StreamWriter writer = new(_logFile, true);
            writer.WriteLine("{ERROR} " + $"{DateTime.Now} - {message}");
        }
    }
}
