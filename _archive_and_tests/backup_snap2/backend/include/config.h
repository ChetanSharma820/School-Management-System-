#ifndef CONFIG_H
#define CONFIG_H

#include <string>
#include <fstream>
#include <sstream>
#include <iostream>
#include <unordered_map>

class Config {
private:
    std::unordered_map<std::string, std::string> envMap;

    void trim(std::string& s) {
        size_t start = s.find_first_not_of(" \t\r\n\"'");
        size_t end = s.find_last_not_of(" \t\r\n\"'");
        if (start == std::string::npos || end == std::string::npos) {
            s = "";
        } else {
            s = s.substr(start, end - start + 1);
        }
    }

public:
    Config() {}

    bool load(const std::string& filepath = "../.env") {
        std::ifstream file(filepath.c_str());
        if (!file.is_open()) {
            // Try current directory as well
            file.open(".env");
            if (!file.is_open()) {
                std::cerr << "[Config] Warning: Could not find .env file at " << filepath << std::endl;
                return false;
            }
        }

        std::string line;
        while (std::getline(file, line)) {
            if (line.empty() || line[0] == '#') continue;
            size_t pos = line.find('=');
            if (pos != std::string::npos) {
                std::string key = line.substr(0, pos);
                std::string val = line.substr(pos + 1);
                trim(key);
                trim(val);
                if (!key.empty()) {
                    envMap[key] = val;
                }
            }
        }
        std::cout << "[Config] Loaded " << envMap.size() << " environment variables." << std::endl;
        return true;
    }

    std::string get(const std::string& key, const std::string& defaultValue = "") const {
        auto it = envMap.find(key);
        if (it != envMap.end()) {
            return it->second;
        }
        return defaultValue;
    }

    int getInt(const std::string& key, int defaultValue = 8080) const {
        auto it = envMap.find(key);
        if (it != envMap.end()) {
            try {
                return std::stoi(it->second);
            } catch (...) {}
        }
        return defaultValue;
    }
};

#endif // CONFIG_H
