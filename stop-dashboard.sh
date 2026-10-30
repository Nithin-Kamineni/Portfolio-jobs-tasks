#!/usr/bin/env bash
# Linux: stops the hidden (or terminal) JobWatcher dashboard until the next login.
REPO="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
if systemctl --user is-active --quiet jobwatcher-dashboard.service 2>/dev/null; then
  systemctl --user stop jobwatcher-dashboard.service && echo "Stopped the dashboard (systemd service)."
  exit 0
fi
PIDFILE="$REPO/data/dashboard.pid"
if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  PID="$(cat "$PIDFILE")"
  PGID="$(ps -o pgid= -p "$PID" | tr -d ' ')"
  # The loop was started with setsid, so it leads its own group: stop the loop and everything under it.
  if [ -n "$PGID" ] && [ "$PGID" = "$PID" ]; then kill -- "-$PGID" 2>/dev/null; else pkill -P "$PID" 2>/dev/null; kill "$PID" 2>/dev/null; fi
  pkill -f "$REPO/dashboard/node_modules/.*tsx.*server/index.ts" 2>/dev/null
  rm -f "$PIDFILE"
  echo "Stopped the dashboard (pid $PID)."
else
  pkill -f "$REPO/dashboard/node_modules/.*tsx.*server/index.ts" 2>/dev/null && echo "Stopped the dashboard." || echo "The dashboard is not running."
fi
