#!/usr/bin/env bash
# Shortcut: starts the JobWatcher dashboard in this terminal (see dashboard/start-dashboard.sh).
exec "$(dirname "$(readlink -f "$0")")/dashboard/start-dashboard.sh" "$@"
