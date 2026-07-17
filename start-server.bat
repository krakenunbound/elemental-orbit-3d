@echo off
setlocal
title Elemental Orbit - Development Server
cd /d "%~dp0"

where powershell.exe >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Windows PowerShell is required but was not found.
  pause
  exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-server.ps1" %*
set "SERVER_EXIT=%ERRORLEVEL%"

if not "%SERVER_EXIT%"=="0" (
  echo.
  echo [ERROR] The Elemental Orbit server stopped with exit code %SERVER_EXIT%.
  pause
)

exit /b %SERVER_EXIT%
