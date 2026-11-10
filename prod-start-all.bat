@echo off
rem Website runs in a minimized window; the backend runs in this window and keeps this script alive.
start "ITI Helpdesk Website" /min "%~dp0prod-website.bat"
call "%~dp0prod-backend.bat"
