#!/usr/bin/env bash
# JobWatcher dashboard on Linux/macOS: the same as start-dashboard.cmd on Windows.
# Starts it (installs packages the first time) on http://localhost:5178. When its code changes the server exits
# with code 75 and this loop builds and starts it again. Hidden mode (JOBWATCHER_HIDDEN=1, set by the autostart):
# no browser tab, output goes to data/dashboard.log, and after a crash it waits a minute and starts again.
cd "$(dirname "$(readlink -f "$0")")" || exit 1
if ! command -v node >/dev/null 2>&1; then echo "Node.js is not installed. Install Node 22 (https://nodejs.org or nvm) and try again." >&2; exit 1; fi
if [ ! -d node_modules ]; then echo "Installing packages, first run only..."; npm install || { echo "npm install failed." >&2; exit 1; }; fi
export JOBWATCHER_SUPERVISED=1
LOG="$(cd .. && pwd)/data/dashboard.log"
mkdir -p "$(dirname "$LOG")"
[ "$JOBWATCHER_HIDDEN" = "1" ] && export JOBWATCHER_NO_OPEN=1
echo $$ > "$(dirname "$LOG")/dashboard.pid"
while true; do
  if [ "$JOBWATCHER_HIDDEN" = "1" ]; then
    echo "==== $(date) starting the dashboard" >> "$LOG"
    npm start >> "$LOG" 2>&1; code=$?
  else
    npm start; code=$?
  fi
  if [ "$code" -eq 75 ]; then echo "Updating the dashboard to the new version..."; export JOBWATCHER_NO_OPEN=1; continue; fi
  if [ "$JOBWATCHER_HIDDEN" = "1" ]; then
    echo "==== $(date) the dashboard exited ($code); retrying in 60 s" >> "$LOG"
    sleep 60; continue
  fi
  exit "$code"
done
