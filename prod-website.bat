
@echo off
title ITI Helpdesk - Website (do not close)

cd /d "%~dp0frontend"

if not exist "dist\index.html" goto notbuilt

rem Try the local installation first
if exist "node_modules\.bin\serve.cmd" (
    set "SERVE_CMD=node_modules\.bin\serve.cmd"
    goto run
)

rem Try the global npm installation
if exist "%APPDATA%\npm\serve.cmd" (
    set "SERVE_CMD=%APPDATA%\npm\serve.cmd"
    goto run
)

rem Try serve from PATH
where serve >nul 2>&1
if not errorlevel 1 (
    set "SERVE_CMD=serve"
    goto run
)

echo.
echo ERROR: serve is not installed or cannot be found.
echo Open Command Prompt and run:
echo npm install -g serve
echo.
pause
exit /b 1

:run
echo Starting ITI Helpdesk website on port 8080...
call "%SERVE_CMD%" -s dist -l 8080

echo.
echo Website stopped. Restarting in 10 seconds.
echo Close this window to stop it.
timeout /t 10 /nobreak >nul
goto run

:notbuilt
echo.
echo STOP: The website has not been built yet.
echo Open Command Prompt in the frontend folder and run:
echo npm install
echo npm run build
pause
exit /b 1
