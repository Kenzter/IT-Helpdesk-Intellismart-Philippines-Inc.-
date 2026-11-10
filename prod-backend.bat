
@echo off
title ITI Helpdesk - Backend (do not close)
cd /d "%~dp0backend"

rem Generate a random secret key if not already configured
for /f "delims=" %%K in ('python -c "import secrets; print(secrets.token_hex(32))"') do set "SECRET_KEY=%%K"

rem Configure allowed frontend origins
set "ALLOWED_ORIGINS=http://YOUR-SERVER-IP:ASSIGNED PORT,http://YOUR-SERVER-NAME"
set "DISABLE_DOCS=1"

rem Check backend folder
if not exist "app\main.py" (
    echo ERROR: app\main.py was not found.
    echo Current folder: %CD%
    pause
    exit /b 1
)

rem Check virtual environment
if not exist ".venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found.
    echo Create it inside the backend folder first.
    pause
    exit /b 1
)

call ".venv\Scripts\activate.bat"

rem Start backend
:run
echo Starting ITI Helpdesk backend...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

echo.
echo Backend stopped. Check the error above.
echo Restarting in 10 seconds. Close this window to stop it.
timeout /t 10 /nobreak >nul
goto run
