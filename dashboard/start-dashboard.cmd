@echo off
rem JobWatcher dashboard: double-click to start it and open http://localhost:5178
rem (installs packages the first time; close this window to stop the dashboard)
rem When its code changes (Claude edited it, or Sync pulled an update) the dashboard restarts itself into the new
rem version: the server exits with code 75 and this script builds and starts it again (no new browser tab).
rem Hidden mode (JOBWATCHER_HIDDEN=1, set by start-hidden.vbs at Windows login): no browser tab, output goes to
rem data\dashboard.log, and after a crash it waits a minute and starts again instead of pausing.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install Node 22 from https://nodejs.org and try again. & if not "%JOBWATCHER_HIDDEN%"=="1" pause & exit /b 1)
if not exist node_modules (
  echo Installing packages, first run only...
  call npm install || (echo npm install failed. & if not "%JOBWATCHER_HIDDEN%"=="1" pause & exit /b 1)
)
set JOBWATCHER_SUPERVISED=1
set LOG=%~dp0..\data\dashboard.log
if "%JOBWATCHER_HIDDEN%"=="1" set JOBWATCHER_NO_OPEN=1
:start
if "%JOBWATCHER_HIDDEN%"=="1" (
  echo ==== %DATE% %TIME% starting the dashboard >> "%LOG%"
  call npm start >> "%LOG%" 2>&1
) else (
  call npm start
)
if errorlevel 76 goto failed
if errorlevel 75 (
  echo.
  echo Updating the dashboard to the new version...
  set JOBWATCHER_NO_OPEN=1
  goto start
)
:failed
if "%JOBWATCHER_HIDDEN%"=="1" (
  rem Hidden: stopped or crashed. Try again in a minute (e.g. the network or port was not ready at login).
  echo ==== %DATE% %TIME% the dashboard exited; retrying in 60 s >> "%LOG%"
  timeout /t 60 /nobreak >nul
  goto start
)
if errorlevel 1 pause
