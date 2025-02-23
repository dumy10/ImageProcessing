cmake_minimum_required(VERSION 3.20)
project(ImagesProcessor VERSION 1.0 LANGUAGES CXX)

# Set C++ standard and required features
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Set output directories for binaries and libraries
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# Enable OpenMP if available
find_package(OpenMP)
if(OpenMP_CXX_FOUND)
    message(STATUS "OpenMP found: ${OpenMP_CXX_FLAGS}")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OpenMP_CXX_FLAGS}")
endif()

# Collect all source files dynamically
file(GLOB_RECURSE SOURCES "${CMAKE_SOURCE_DIR}/ImagesProcessor/*.cpp")

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

# Link OpenMP if available
if(OpenMP_CXX_FOUND)
    target_link_libraries(ImagesProcessor PRIVATE OpenMP::OpenMP_CXX)
endif()

# Set Windows-specific options
if(WIN32)
    target_compile_definitions(ImagesProcessor PRIVATE _WINDOWS)
endif()

# Installation target (optional)
install(TARGETS ImagesProcessor
    RUNTIME DESTINATION bin
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)

# Display summary
message(STATUS "Project: ${PROJECT_NAME}")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "Source files: ${SOURCES}")
message(STATUS "Output directory: ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}")
