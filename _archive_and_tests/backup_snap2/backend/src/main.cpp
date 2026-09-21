#include <iostream>
#include "../include/config.h"
#include "../include/http_server.h"

int main() {
    std::cout << "==========================================================" << std::endl;
    std::cout << "   🏫 SCHOOL MANAGEMENT SYSTEM - C++ BACKEND SERVER       " << std::endl;
    std::cout << "==========================================================" << std::endl;

    Config config;
    if (!config.load()) {
        std::cout << "[Main] Using default configurations." << std::endl;
    }

    HttpServer server;
    if (!server.init(config)) {
        std::cerr << "[Main] Server initialization failed!" << std::endl;
        return 1;
    }

    server.start();

    return 0;
}
