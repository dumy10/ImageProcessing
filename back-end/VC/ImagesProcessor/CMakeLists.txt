cmake_minimum_required(VERSION 3.21)
project(ImagesProcessor VERSION 1.0 LANGUAGES CXX)

# Set C++ standard and required features
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Set output directories for binaries and libraries
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# Define platform flags
if(WIN32)
    set(PLATFORM_WINDOWS TRUE)
    add_compile_definitions(_WINDOWS)
elseif(UNIX AND NOT APPLE)
    set(PLATFORM_LINUX TRUE)
    add_compile_definitions(_LINUX)
endif()

# Enable OpenMP if available
find_package(OpenMP)
if(OpenMP_CXX_FOUND)
    message(STATUS "OpenMP found: ${OpenMP_CXX_FLAGS}")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OpenMP_CXX_FLAGS}")
endif()

# Collect all source files dynamically
file(GLOB_RECURSE SOURCES "${CMAKE_SOURCE_DIR}/ImagesProcessor/*.cpp")
file(GLOB_RECURSE TEST_SOURCES "${CMAKE_SOURCE_DIR}/ImagesProcessorTests/*.cpp")

# Include Windows resource file if on Windows
if(PLATFORM_WINDOWS)
    list(APPEND SOURCES "${CMAKE_SOURCE_DIR}/ImagesProcessor/ImagesProcessor/ImagesProcessor.rc")
endif()

# Define the target library
add_library(ImagesProcessor SHARED ${SOURCES})

# Add include directories
target_include_directories(ImagesProcessor PRIVATE
    ${CMAKE_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/external/stb-master
)

# Precompiled header
target_precompile_headers(ImagesProcessor PRIVATE ${CMAKE_SOURCE_DIR}/ImagesProcessor/pch.h)

# Set compiler definitions for exports and warnings
target_compile_definitions(ImagesProcessor PRIVATE 
    _CRT_SECURE_NO_WARNINGS
    IMAGESPROCESSOR_EXPORTS
)

# Set Linux-specific properties
if(PLATFORM_LINUX)
    # Output as libImagesProcessor.so on Linux
    set_target_properties(ImagesProcessor PROPERTIES PREFIX "lib")
    
    # Add visibility flags
    target_compile_options(ImagesProcessor PRIVATE -fvisibility=hidden)
    
    # On Linux, add these libs (may be needed for filesystem, etc.)
    target_link_libraries(ImagesProcessor PRIVATE pthread dl)
endif()

# Link OpenMP if available
if(OpenMP_CXX_FOUND)
    target_link_libraries(ImagesProcessor PRIVATE OpenMP::OpenMP_CXX)
endif()

# Download and unpack Google Test and Google Mock at configure time
configure_file(CMakeLists.txt.in googletest-download/CMakeLists.txt)
execute_process(COMMAND ${CMAKE_COMMAND} -G "${CMAKE_GENERATOR}" .
    RESULT_VARIABLE result
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/googletest-download )
if(result)
    message(FATAL_ERROR "CMake step for googletest failed: ${result}")
endif()
execute_process(COMMAND ${CMAKE_COMMAND} --build .
    RESULT_VARIABLE result
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/googletest-download )
if(result)
    message(FATAL_ERROR "Build step for googletest failed: ${result}")
endif()

# Add googletest and googlemock to build. This will define the gtest, gtest_main, gmock, and gmock_main targets.
add_subdirectory(${CMAKE_BINARY_DIR}/googletest-src
                 ${CMAKE_BINARY_DIR}/googletest-build
                 EXCLUDE_FROM_ALL)

# Define the test executable
add_executable(ImagesProcessorTests ${TEST_SOURCES})

# Link the ImagesProcessor library, Google Test, and Google Mock to the test executable
target_link_libraries(ImagesProcessorTests PRIVATE ImagesProcessor gtest gtest_main gmock gmock_main)

# Add include directories for tests
target_include_directories(ImagesProcessorTests PRIVATE
    ${CMAKE_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/ImagesProcessor
    ${CMAKE_SOURCE_DIR}/external/stb-master
)

# Installation target
install(TARGETS ImagesProcessor
    RUNTIME DESTINATION bin
    LIBRARY DESTINATION bin
    ARCHIVE DESTINATION lib
)

# Display summary
message(STATUS "Project: ${PROJECT_NAME}")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "Platform: ${CMAKE_SYSTEM_NAME}")
if(PLATFORM_WINDOWS)
    message(STATUS "Building for Windows")
elseif(PLATFORM_LINUX)
    message(STATUS "Building for Linux")
endif()
message(STATUS "Output directory: ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}")
