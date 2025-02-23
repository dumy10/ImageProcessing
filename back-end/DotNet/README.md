# ImagesAPI Project

## How to build the project

### Prerequisites
- Visual Studio 2022
- .NET SDK 8.x
- CMake 3.22.0 or higher

### Steps to build

#### Step 1: Build the VC Project using CMake

1. Navigate to the VC project directory:
    ```sh
    cd ../../VC/ImagesProcessor
    ```

2. Create a build directory and navigate into it:
    ```sh
    mkdir build
    cd build
    ```

3. Configure the project using CMake:
    ```sh
    cmake -G "Visual Studio 17 2022" -A x64 ..
    ```

4. Build the project:
    ```sh
    cmake --build . --config Release
    ```

#### Step 2: Build the .NET Project

You can build the .NET project either using the `dotnet` CLI or by building the solution file.

##### Option 1: Build with `dotnet` CLI

1. Navigate to the .NET project directory:
    ```sh
    cd ../../DotNet/ImagesAPI/ImagesAPI
    ```

2. Build the project:
    ```sh
    dotnet build --configuration Release --runtime win-x64
    ```

3. Publish the project:
    ```sh
    dotnet publish -c Release -o "./publish"
    ```

##### Option 2: Build the Solution File

1. Navigate to the solution directory:
    ```sh
    cd ../../..
    ```

2. Open the solution file in Visual Studio and build the solution, or use the following command:
    ```sh
    msbuild ImagesAPI.sln /p:Configuration=Release
    ```

### Running Tests

You can run the tests either using the `dotnet` CLI or by opening the solution file in Visual Studio.

#### Option 1: Run Tests with `dotnet` CLI

1. Navigate to the test project directory:
    ```sh
    cd ../../DotNet/ImagesAPITests/ImagesAPITests
    ```

2. Run the tests:
    ```sh
    dotnet test
    ```

#### Option 2: Run Tests in Visual Studio

1. Open the solution file in Visual Studio:
    ```sh
    cd ../../..
    start ImagesAPI.sln
    ```

2. Build the solution and run the tests using the Test Explorer.

### Additional Information

- Ensure that the `ImagesProcessor.dll` file generated from the VC project is copied to the appropriate location for the .NET project to reference it correctly.
- The `ImagesProcessor.dll` file should be located in the `build/bin/Release` directory after building the VC project.
- Note that the debug path for the ImagesAPI project is different than the release path because of GitHub Actions.
- The project should be run in debug mode locally to ensure the correct paths are used.