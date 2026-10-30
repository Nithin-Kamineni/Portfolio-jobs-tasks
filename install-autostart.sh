#!/usr/bin/env bash
# Linux: makes the JobWatcher dashboard start by itself, hidden, when you log in, and starts it now.
# Run once on the PC (bash install-autostart.sh). Undo with uninstall-autostart.sh; stop with stop-dashboard.sh.
# Uses a systemd user service when systemd is available, otherwise a desktop-session autostart entry.
set -e
REPO="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
START="$REPO/dashboard/start-dashboard.sh"
chmod +x "$START" "$REPO/start-dashboard.sh" "$REPO/stop-dashboard.sh" "$REPO/uninstall-autostart.sh" 2>/dev/null || true
command -v node >/dev/null || { echo "Node.js is not on PATH. Install Node 22 first." >&2; exit 1; }
command -v claude >/dev/null || echo "Note: 'claude' is not on PATH; Claude runs will fail until Claude Code is installed and logged in."

if systemctl --user show-environment >/dev/null 2>&1; then
  UNIT="$HOME/.config/systemd/user/jobwatcher-dashboard.service"
  mkdir -p "$(dirname "$UNIT")"
  # PATH is captured now so the service finds node (nvm), npm and claude like this terminal does.
  cat > "$UNIT" <<EOF
[Unit]
Description=JobWatcher dashboard (http://localhost:5178)
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$REPO/dashboard
Environment=JOBWATCHER_HIDDEN=1
Environment=PATH=$PATH
Environment=HOME=$HOME
ExecStart=/usr/bin/env bash $START
KillMode=control-group
Restart=always
RestartSec=60

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now jobwatcher-dashboard.service
  echo "Installed (systemd user service): the dashboard starts hidden when you log in, and it is starting now."
  echo "Logs: $REPO/data/dashboard.log · status: systemctl --user status jobwatcher-dashboard"
else
  DESK="$HOME/.config/autostart/jobwatcher-dashboard.desktop"
  mkdir -p "$(dirname "$DESK")"
  cat > "$DESK" <<EOF
[Desktop Entry]
Type=Application
Name=JobWatcher dashboard
Comment=Starts the JobWatcher dashboard hidden at login (installed by $REPO/install-autostart.sh)
Exec=env JOBWATCHER_HIDDEN=1 PATH=$PATH setsid bash "$START"
Terminal=false
X-GNOME-Autostart-enabled=true
EOF
  echo "Installed (desktop autostart): the dashboard starts hidden when you log in."
  if ! (exec 3<>/dev/tcp/127.0.0.1/5178) 2>/dev/null; then
    JOBWATCHER_HIDDEN=1 setsid bash "$START" >/dev/null 2>&1 < /dev/null &
    echo "Started it now; it is ready in about 30 s at http://localhost:5178."
  else
    echo "It is already running on http://localhost:5178."
  fi
fi
