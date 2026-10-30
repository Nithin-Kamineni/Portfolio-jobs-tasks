@echo off
rem Stops the hidden (or visible) JobWatcher dashboard: its start-dashboard.cmd loop and everything under it.
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='cmd.exe'\" | Where-Object { $_.CommandLine -like '*start-dashboard.cmd*' } | ForEach-Object { taskkill /PID $_.ProcessId /T /F | Out-Null; 'Stopped the dashboard (pid ' + $_.ProcessId + ').' }"
