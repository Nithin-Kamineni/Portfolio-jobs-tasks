' Starts the JobWatcher dashboard with no window (used at Windows login by install-autostart.cmd).
' Output goes to data\dashboard.log. Stop it with stop-dashboard.cmd in the repo folder.
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)
sh.Environment("Process")("JOBWATCHER_HIDDEN") = "1"
sh.Environment("Process")("JOBWATCHER_NO_OPEN") = "1"
sh.Run "cmd /c """ & here & "\start-dashboard.cmd""", 0, False
