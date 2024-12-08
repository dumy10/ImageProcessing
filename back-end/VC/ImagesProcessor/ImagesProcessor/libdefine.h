#pragma once
#ifdef IMAGESPROCESSOR_EXPORTS
#define IMAGESPROCESSOR_API __declspec(dllexport)
#else
#define IMAGESPROCESSOR_API __declspec(dllimport)
#endif