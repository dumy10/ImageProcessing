#pragma once

#if defined(_WIN32) || defined(_WIN64)
    #ifdef IMAGESPROCESSOR_EXPORTS
        #define IMAGESPROCESSOR_API __declspec(dllexport)
    #else
        #define IMAGESPROCESSOR_API __declspec(dllimport)
    #endif
#else
    #ifdef IMAGESPROCESSOR_EXPORTS
        #define IMAGESPROCESSOR_API __attribute__((visibility("default")))
    #else
        #define IMAGESPROCESSOR_API
    #endif
#endif