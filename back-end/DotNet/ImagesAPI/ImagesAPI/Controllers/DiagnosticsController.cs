using ImagesAPI.External;
using ImagesAPI.Helpers;
using Microsoft.AspNetCore.Mvc;
using SkiaSharp;
using System.Runtime.InteropServices;
using System.Text;

namespace ImagesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiagnosticsController : ControllerBase
    {
        [HttpGet("native-library-status")]
        public ActionResult GetNativeLibraryStatus()
        {
            if (!AuthHelper.IsAdmin(HttpContext))
            {
                return Unauthorized("Admin access required.");
            }

            var result = new StringBuilder();

            // Get basic environment information
            result.AppendLine("## Environment Information");
            result.AppendLine($"OS: {RuntimeInformation.OSDescription}");
            result.AppendLine($"OS Architecture: {RuntimeInformation.OSArchitecture}");
            result.AppendLine($"Process Architecture: {RuntimeInformation.ProcessArchitecture}");
            result.AppendLine($"Framework: {RuntimeInformation.FrameworkDescription}");
            result.AppendLine($"RUNNING_IN_DOCKER: {Environment.GetEnvironmentVariable("RUNNING_IN_DOCKER") ?? "not set"}");
            result.AppendLine($"ASPNETCORE_ENVIRONMENT: {Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "not set"}");
            result.AppendLine($"LD_LIBRARY_PATH: {Environment.GetEnvironmentVariable("LD_LIBRARY_PATH") ?? "not set"}");
            result.AppendLine();

            // Check for library files
            string appPath = AppDomain.CurrentDomain.BaseDirectory;
            result.AppendLine("## Library Files");
            result.AppendLine($"Base Directory: {appPath}");

            string[] libFiles = ["ImagesProcessor.dll", "libImagesProcessor.so", "libImagesProcessor.so.1"];
            foreach (var file in libFiles)
            {
                string path = Path.Combine(appPath, file);
                bool exists = System.IO.File.Exists(path);
                result.AppendLine($"{file}: {(exists ? "EXISTS" : "NOT FOUND")}");

                if (exists)
                {
                    var fileInfo = new FileInfo(path);
                    result.AppendLine($"  - Size: {fileInfo.Length} bytes");
                    result.AppendLine($"  - Last modified: {fileInfo.LastWriteTime}");
                    result.AppendLine($"  - Permissions: {fileInfo.Attributes}");

                    // For Linux, check file permissions with ldd if possible
                    if (OperatingSystem.IsLinux())
                    {
                        try
                        {
                            // Use file command to get more info about the binary
                            var process = new System.Diagnostics.Process
                            {
                                StartInfo = new System.Diagnostics.ProcessStartInfo
                                {
                                    FileName = "file",
                                    Arguments = path,
                                    RedirectStandardOutput = true,
                                    UseShellExecute = false,
                                    CreateNoWindow = true
                                }
                            };
                            process.Start();
                            string fileOutput = process.StandardOutput.ReadToEnd();
                            process.WaitForExit();
                            result.AppendLine($"  - File info: {fileOutput.Trim()}");

                            // Use ldd to check dependencies
                            process = new System.Diagnostics.Process
                            {
                                StartInfo = new System.Diagnostics.ProcessStartInfo
                                {
                                    FileName = "ldd",
                                    Arguments = path,
                                    RedirectStandardOutput = true,
                                    UseShellExecute = false,
                                    CreateNoWindow = true
                                }
                            };
                            process.Start();
                            string lddOutput = process.StandardOutput.ReadToEnd();
                            process.WaitForExit();
                            result.AppendLine($"  - Dependencies: \n{lddOutput.Trim()}");
                        }
                        catch (Exception ex)
                        {
                            result.AppendLine($"  - Error checking file: {ex.Message}");
                        }
                    }
                }
            }
            result.AppendLine();

            // Try to actually use the libraries
            result.AppendLine("## Library Loading Tests");

            // Test SkiaSharp first - which we know works
            try
            {
                using var bitmap = new SKBitmap(100, 100);
                result.AppendLine("SkiaSharp: WORKING - Created bitmap successfully");
            }
            catch (Exception ex)
            {
                result.AppendLine($"SkiaSharp: FAILED - {ex.Message}");
                if (ex.InnerException != null)
                {
                    result.AppendLine($"  Inner exception: {ex.InnerException.Message}");
                }
            }

            // Now test our native library
            try
            {
                // Try to call a simple function from our library
                bool filterResult = ImageProcessor.ProcessDummyTest();
                result.AppendLine($"ImagesProcessor: {(filterResult ? "WORKING" : "FAILED")} - Test method returned {filterResult}");
            }
            catch (Exception ex)
            {
                result.AppendLine($"ImagesProcessor: FAILED - {ex.Message}");
                if (ex.InnerException != null)
                {
                    result.AppendLine($"  Inner exception: {ex.InnerException.Message}");
                }

                result.AppendLine($"  Exception type: {ex.GetType().FullName}");
                result.AppendLine($"  Stack trace: {ex.StackTrace}");

                // Check if it's a DllNotFoundException or EntryPointNotFoundException 
                if (ex is DllNotFoundException || ex is EntryPointNotFoundException)
                {
                    result.AppendLine("\nThis suggests the native library is either not found or incorrectly built.");
                    result.AppendLine("Common issues:");
                    result.AppendLine("1. Library file missing in deployment");
                    result.AppendLine("2. Library has incorrect architecture (32-bit vs 64-bit)");
                    result.AppendLine("3. Library built without the expected exported functions");
                    result.AppendLine("4. Library has dependencies that are not installed in the container");
                }
            }

            // Try to access log file if it exists
            try
            {
                string logDir = Path.Combine(appPath, "ImagesProcessorLogs");
                if (Directory.Exists(logDir))
                {
                    result.AppendLine("\n## Recent Logs");
                    var logFiles = Directory.GetFiles(logDir).OrderByDescending(f => new FileInfo(f).LastWriteTime).Take(1);
                    foreach (var logFile in logFiles)
                    {
                        result.AppendLine($"Log file: {Path.GetFileName(logFile)}");
                        string[] lastLines = [.. System.IO.File.ReadAllLines(logFile).TakeLast(20)];
                        result.AppendLine("Last 20 log lines:");
                        foreach (var line in lastLines)
                        {
                            result.AppendLine($"  {line}");
                        }
                    }
                }
                else
                {
                    result.AppendLine("\n## Logs directory does not exist");
                }
            }
            catch (Exception ex)
            {
                result.AppendLine($"\n## Error accessing logs: {ex.Message}");
            }

            // Send result as text
            return Content(result.ToString(), "text/plain");
        }
    }
}