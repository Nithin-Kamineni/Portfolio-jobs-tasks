#!/usr/bin/env bash
# Linux: stops the dashboard from starting at login (and stops it now if it runs as the systemd service).
if systemctl --user list-unit-files jobwatcher-dashboard.service >/dev/null 2>&1; then
  systemctl --user disable --now jobwatcher-dashboard.service 2>/dev/null
  rm -f "$HOME/.config/systemd/user/jobwatcher-dashboard.service"
  systemctl --user daemon-reload 2>/dev/null
fi
rm -f "$HOME/.config/autostart/jobwatcher-dashboard.desktop"
echo "Removed: the dashboard no longer starts at login."
