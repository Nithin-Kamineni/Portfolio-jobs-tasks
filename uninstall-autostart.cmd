@echo off
rem Stops the dashboard from starting at Windows login (it keeps running until you stop it or log out;
rem stop it now with stop-dashboard.cmd).
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\JobWatcher dashboard.vbs" 2>nul
echo Removed: the dashboard no longer starts at login.
