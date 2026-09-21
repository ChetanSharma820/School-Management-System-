#ifndef HTTP_SERVER_H
#define HTTP_SERVER_H

#include <string>
#include <winsock2.h>
#include <windows.h>
#include "db_client.h"

struct HttpRequest {
    std::string method;
    std::string path;
    std::string query;
    std::string body;
};

class HttpServer {
private:
    int port;
    SOCKET serverSocket;
    DatabaseClient dbClient;
    bool running;

    HttpRequest parseRequest(const std::string& rawRequest);
    std::string handleRoute(const HttpRequest& req);
    void sendResponse(SOCKET clientSocket, int statusCode, const std::string& contentType, const std::string& body);

public:
    HttpServer(int port = 8080);
    ~HttpServer();

    bool init(const Config& config);
    void start();
    void stop();
};

#endif // HTTP_SERVER_H
