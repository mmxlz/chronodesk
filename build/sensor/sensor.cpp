// ChronoDesk Sensor Reader - lightweight C++ alternative to PowerShell+LHM
// Reads CPU temp, GPU info, memory usage via NVML + Windows APIs
// Outputs JSON every 2 seconds to stdout

#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// NVML types and function pointers
typedef int nvmlReturn_t;
typedef void* nvmlDevice_t;

#define NVML_SUCCESS 0
#define NVML_TEMPERATURE_GPU 0

typedef nvmlReturn_t (*pNvmlInit)(void);
typedef nvmlReturn_t (*pNvmlShutdown)(void);
typedef nvmlReturn_t (*pNvmlDeviceGetHandleByIndex)(unsigned int, nvmlDevice_t*);
typedef nvmlReturn_t (*pNvmlDeviceGetTemperature)(nvmlDevice_t, int, unsigned int*);
typedef nvmlReturn_t (*pNvmlDeviceGetUtilizationRates)(nvmlDevice_t, void*);
typedef nvmlReturn_t (*pNvmlDeviceGetPowerUsage)(nvmlDevice_t, unsigned int*);
typedef nvmlReturn_t (*pNvmlDeviceGetClock)(nvmlDevice_t, int, int, unsigned int*);
typedef nvmlReturn_t (*pNvmlDeviceGetMaxClock)(nvmlDevice_t, int, unsigned int*);
typedef nvmlReturn_t (*pNvmlDeviceGetMemoryInfo)(nvmlDevice_t, void*);
typedef nvmlReturn_t (*pNvmlDeviceGetName)(nvmlDevice_t, char*, unsigned int);
typedef const char* (*pNvmlErrorString)(nvmlReturn_t);

struct nvmlUtilization_t {
    unsigned int gpu;
    unsigned int memory;
};

struct nvmlMemory_t {
    unsigned long long total;
    unsigned long long free;
    unsigned long long used;
};

// NVML function pointers
static pNvmlInit NvmlInit = NULL;
static pNvmlShutdown NvmlShutdown = NULL;
static pNvmlDeviceGetHandleByIndex NvmlDeviceGetHandleByIndex = NULL;
static pNvmlDeviceGetTemperature NvmlDeviceGetTemperature = NULL;
static pNvmlDeviceGetUtilizationRates NvmlDeviceGetUtilizationRates = NULL;
static pNvmlDeviceGetPowerUsage NvmlDeviceGetPowerUsage = NULL;
static pNvmlDeviceGetClock NvmlDeviceGetClock = NULL;
static pNvmlDeviceGetMaxClock NvmlDeviceGetMaxClock = NULL;
static pNvmlDeviceGetMemoryInfo NvmlDeviceGetMemoryInfo = NULL;
static pNvmlDeviceGetName NvmlDeviceGetName = NULL;
static pNvmlErrorString NvmlErrorString = NULL;

static HMODULE hNvml = NULL;
static nvmlDevice_t nvmlDevice = NULL;
static int nvmlReady = 0;

// NVML clock types
#define NVML_CLOCK_GRAPHICS 0
#define NVML_CLOCK_SM 1
#define NVML_CLOCK_MEM 2
#define NVML_CLOCK_VIDEO 3

// Try to load NVML and initialize
static int initNvml() {
    // Try common NVML DLL locations
    const char* paths[] = {
        "nvml.dll",
        "C:\\Windows\\System32\\nvml.dll",
        NULL
    };

    // Also try NVIDIA driver path
    char nvmlPath[MAX_PATH];
    char* sysRoot = getenv("ProgramFiles");
    if (sysRoot) {
        snprintf(nvmlPath, MAX_PATH, "%s\\NVIDIA Corporation\\NVSMI\\nvml.dll", sysRoot);
        paths[2] = nvmlPath;
    }

    for (int i = 0; paths[i]; i++) {
        hNvml = LoadLibraryA(paths[i]);
        if (hNvml) break;
    }

    if (!hNvml) return 0;

    NvmlInit = (pNvmlInit)GetProcAddress(hNvml, "nvmlInit_v2");
    if (!NvmlInit) NvmlInit = (pNvmlInit)GetProcAddress(hNvml, "nvmlInit");
    NvmlShutdown = (pNvmlShutdown)GetProcAddress(hNvml, "nvmlShutdown");
    NvmlDeviceGetHandleByIndex = (pNvmlDeviceGetHandleByIndex)GetProcAddress(hNvml, "nvmlDeviceGetHandleByIndex_v2");
    if (!NvmlDeviceGetHandleByIndex) NvmlDeviceGetHandleByIndex = (pNvmlDeviceGetHandleByIndex)GetProcAddress(hNvml, "nvmlDeviceGetHandleByIndex");
    NvmlDeviceGetTemperature = (pNvmlDeviceGetTemperature)GetProcAddress(hNvml, "nvmlDeviceGetTemperature");
    NvmlDeviceGetUtilizationRates = (pNvmlDeviceGetUtilizationRates)GetProcAddress(hNvml, "nvmlDeviceGetUtilizationRates");
    NvmlDeviceGetPowerUsage = (pNvmlDeviceGetPowerUsage)GetProcAddress(hNvml, "nvmlDeviceGetPowerUsage");
    NvmlDeviceGetClock = (pNvmlDeviceGetClock)GetProcAddress(hNvml, "nvmlDeviceGetClock");
    NvmlDeviceGetMaxClock = (pNvmlDeviceGetMaxClock)GetProcAddress(hNvml, "nvmlDeviceGetMaxClock");
    NvmlDeviceGetMemoryInfo = (pNvmlDeviceGetMemoryInfo)GetProcAddress(hNvml, "nvmlDeviceGetMemoryInfo");
    NvmlDeviceGetName = (pNvmlDeviceGetName)GetProcAddress(hNvml, "nvmlDeviceGetName");
    NvmlErrorString = (pNvmlErrorString)GetProcAddress(hNvml, "nvmlErrorString");

    if (!NvmlInit || !NvmlShutdown || !NvmlDeviceGetHandleByIndex) {
        FreeLibrary(hNvml);
        hNvml = NULL;
        return 0;
    }

    nvmlReturn_t ret = NvmlInit();
    if (ret != NVML_SUCCESS) {
        FreeLibrary(hNvml);
        hNvml = NULL;
        return 0;
    }

    ret = NvmlDeviceGetHandleByIndex(0, &nvmlDevice);
    if (ret != NVML_SUCCESS) {
        NvmlShutdown();
        FreeLibrary(hNvml);
        hNvml = NULL;
        return 0;
    }

    nvmlReady = 1;
    return 1;
}

static void shutdownNvml() {
    if (nvmlReady && NvmlShutdown) {
        NvmlShutdown();
    }
    if (hNvml) {
        FreeLibrary(hNvml);
        hNvml = NULL;
    }
    nvmlReady = 0;
}

// Get CPU usage via GetSystemTimes
static ULONGLONG prevIdle = 0, prevKernel = 0, prevUser = 0;

static double getCpuUsage() {
    FILETIME idleTime, kernelTime, userTime;
    if (!GetSystemTimes(&idleTime, &kernelTime, &userTime)) return -1;

    ULONGLONG idle = (((ULONGLONG)idleTime.dwHighDateTime) << 32) | idleTime.dwLowDateTime;
    ULONGLONG kernel = (((ULONGLONG)kernelTime.dwHighDateTime) << 32) | kernelTime.dwLowDateTime;
    ULONGLONG user = (((ULONGLONG)userTime.dwHighDateTime) << 32) | userTime.dwLowDateTime;

    ULONGLONG idleDiff = idle - prevIdle;
    ULONGLONG kernelDiff = kernel - prevKernel;
    ULONGLONG userDiff = user - prevUser;
    ULONGLONG totalDiff = kernelDiff + userDiff;

    prevIdle = idle;
    prevKernel = kernel;
    prevUser = user;

    if (totalDiff == 0) return 0;
    return (double)(totalDiff - idleDiff) * 100.0 / totalDiff;
}

// Get CPU temperature via thermal zone (no admin, may read low)
static int getCpuTempFromThermalZone() {
    // Use WMI via COM to read thermal zone
    // For now return -1, will be filled by LHM or fallback
    return -1;
}

// Get memory info
static void getMemoryInfo(unsigned long long* total, unsigned long long* available) {
    MEMORYSTATUSEX mem;
    mem.dwLength = sizeof(mem);
    if (GlobalMemoryStatusEx(&mem)) {
        *total = mem.ullTotalPhys;
        *available = mem.ullAvailPhys;
    }
}

// Escape JSON string
static void jsonEscape(char* dst, const char* src, int dstSize) {
    int j = 0;
    for (int i = 0; src[i] && j < dstSize - 2; i++) {
        if (src[i] == '"' || src[i] == '\\') {
            dst[j++] = '\\';
        }
        dst[j++] = src[i];
    }
    dst[j] = '\0';
}

int main() {
    // Disable stdout buffering for immediate output
    setvbuf(stdout, NULL, _IONBF, 0);

    // Initialize
    int hasNvml = initNvml();

    // First call to establish CPU baseline
    getCpuUsage();
    Sleep(100);

    // Main loop
    while (1) {
        char gpuName[256] = "Unknown";
        int gpuTemp = -1;
        int gpuLoad = -1;
        int gpuMemLoad = -1;
        int gpuPower = -1;
        int gpuCoreClock = -1;
        int gpuMemClock = -1;
        unsigned long long gpuMemTotal = 0;
        unsigned long long gpuMemUsed = 0;

        if (nvmlReady) {
            // GPU name
            if (NvmlDeviceGetName) {
                NvmlDeviceGetName(nvmlDevice, gpuName, sizeof(gpuName));
            }

            // GPU temperature
            unsigned int temp;
            if (NvmlDeviceGetTemperature && NvmlDeviceGetTemperature(nvmlDevice, NVML_TEMPERATURE_GPU, &temp) == NVML_SUCCESS) {
                gpuTemp = (int)temp;
            }

            // GPU utilization
            nvmlUtilization_t util;
            if (NvmlDeviceGetUtilizationRates && NvmlDeviceGetUtilizationRates(nvmlDevice, &util) == NVML_SUCCESS) {
                gpuLoad = util.gpu;
                gpuMemLoad = util.memory;
            }

            // GPU power
            unsigned int power;
            if (NvmlDeviceGetPowerUsage && NvmlDeviceGetPowerUsage(nvmlDevice, &power) == NVML_SUCCESS) {
                gpuPower = power / 1000; // mW to W
            }

            // GPU clocks (4-param: device, type, clockId=0 for current, &clock)
            unsigned int clock;
            if (NvmlDeviceGetClock) {
                if (NvmlDeviceGetClock(nvmlDevice, NVML_CLOCK_GRAPHICS, 0, &clock) == NVML_SUCCESS) {
                    gpuCoreClock = clock;
                }
                if (NvmlDeviceGetClock(nvmlDevice, NVML_CLOCK_MEM, 0, &clock) == NVML_SUCCESS) {
                    gpuMemClock = clock;
                }
            }
            // Fallback: try max clock if current returns -1
            if (gpuCoreClock <= 0 && NvmlDeviceGetMaxClock) {
                if (NvmlDeviceGetMaxClock(nvmlDevice, NVML_CLOCK_GRAPHICS, &clock) == NVML_SUCCESS) {
                    gpuCoreClock = clock;
                }
            }
            if (gpuMemClock <= 0 && NvmlDeviceGetMaxClock) {
                if (NvmlDeviceGetMaxClock(nvmlDevice, NVML_CLOCK_MEM, &clock) == NVML_SUCCESS) {
                    gpuMemClock = clock;
                }
            }

            // GPU memory
            nvmlMemory_t mem;
            if (NvmlDeviceGetMemoryInfo && NvmlDeviceGetMemoryInfo(nvmlDevice, &mem) == NVML_SUCCESS) {
                gpuMemTotal = mem.total / (1024 * 1024); // bytes to MB
                gpuMemUsed = mem.used / (1024 * 1024);
            }
        }

        // CPU usage
        double cpuUsage = getCpuUsage();

        // CPU temperature
        int cpuTemp = getCpuTempFromThermalZone();

        // Memory
        unsigned long long memTotal = 0, memAvail = 0;
        getMemoryInfo(&memTotal, &memAvail);
        unsigned long long memUsed = memTotal - memAvail;

        // Output JSON
        char escapedName[512];
        jsonEscape(escapedName, gpuName, sizeof(escapedName));

        printf("{\"cpu\":{\"usage\":%.1f,\"temp\":%d},\"gpu\":{\"name\":\"%s\",\"temp\":%d,\"load\":%d,\"memLoad\":%d,\"power\":%d,\"coreClock\":%d,\"memClock\":%d,\"memTotal\":%llu,\"memUsed\":%llu},\"mem\":{\"total\":%llu,\"used\":%llu,\"available\":%llu}}\n",
            cpuUsage >= 0 ? cpuUsage : 0,
            cpuTemp,
            escapedName,
            gpuTemp, gpuLoad, gpuMemLoad, gpuPower, gpuCoreClock, gpuMemClock,
            gpuMemTotal, gpuMemUsed,
            memTotal, memUsed, memAvail
        );

        Sleep(2000);
    }

    shutdownNvml();
    return 0;
}
