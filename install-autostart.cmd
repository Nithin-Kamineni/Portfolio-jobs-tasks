@echo off
rem Makes the JobWatcher dashboard start by itself, hidden, every time you log in to Windows,
rem and starts it now. Run once per PC (home and work). Undo with uninstall-autostart.cmd.
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set TARGET=%~dp0dashboard\start-hidden.vbs
> "%STARTUP%\JobWatcher dashboard.vbs" (
  echo ' Starts the JobWatcher dashboard hidden at login. Installed by %~dp0install-autostart.cmd
  echo CreateObject^("WScript.Shell"^).Run "wscript ""%TARGET%""", 0, False
)
echo Installed: the dashboard now starts hidden when you log in.
netstat -ano | findstr /r /c:":5178 .*LISTENING" >nul && (echo It is already running on http://localhost:5178.) || (wscript "%TARGET%" & echo Started it now; it is ready in about 30 s at http://localhost:5178.)
