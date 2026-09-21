@echo off
echo ==========================================================
echo 🔨 Compiling School Management System C++ Backend...
echo ==========================================================

if not exist "bin" mkdir bin

g++ -std=c++14 src/main.cpp src/db_client.cpp src/http_server.cpp -Iinclude -lws2_32 -lwininet -o bin/server.exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build SUCCESSFUL! Output binary: backend\bin\server.exe
    echo ==========================================================
) else (
    echo.
    echo ❌ Build FAILED! Check error messages above.
    echo ==========================================================
)
