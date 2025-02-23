# ImagesProcessor Project

## How to build the project

### Prerequisites
- Visual Studio 2022
- CMake 3.22.0 or higher

### Steps to build with CMake

1. Make sure that you are in the solution directory.
2. Run the following commands:

```sh
mkdir build
cd build
cmake -G "Visual Studio 17 2022" -A x64 ..
cmake --build . --config Debug
```

### Steps to build with Visual Studio

1. Open Visual Studio 2022.
2. Go to `File` -> `Open` -> `Project/Solution`.
3. Navigate to the solution directory and open the `ImagesProcessor.sln` file.
4. Select the desired configuration (e.g., Debug, Release) and platform (e.g., x64, Win32).
5. Build the solution by clicking on `Build` -> `Build Solution`.