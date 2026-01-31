# Multi-Machine Setup Guide

This guide walks through setting up Claude Dash to monitor sessions across multiple machines on your local network.

## Setup Overview

1. **Server Machine** - One machine runs the central server and dashboard
2. **Client Machines** - Other machines run the agent to report their sessions

## Server Machine Setup

### 1. Install and Start

```bash
cd claude-dash
npm install
npm run dev:all
```

This starts:
- Dashboard UI at http://localhost:5173
- API server at http://localhost:3001

### 2. Find Your Server's IP Address

**Recommended (cross-platform):**
```bash
npm run server-ip
```

**Or manually:**
- Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Linux: `ip addr show | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig | findstr IPv4`

You'll see something like `192.168.1.10` - this is your server IP.

### 3. Open the Dashboard

Open http://localhost:5173 in your browser.

You should see sessions from this machine automatically detected!

## Client Machine Setup

### 1. Install claude-dash

On each additional machine:

```bash
git clone <this-repo>
cd claude-dash
npm install
```

### 2. Configure the Agent

**Mac/Linux:**
```bash
export SERVER_URL=http://<server-ip>:3001
export MACHINE_NAME=my-laptop  # Optional
```

**Windows (PowerShell):**
```powershell
$env:SERVER_URL="http://<server-ip>:3001"
$env:MACHINE_NAME="my-laptop"  # Optional
```

**Windows (Command Prompt):**
```cmd
set SERVER_URL=http://<server-ip>:3001
set MACHINE_NAME=my-laptop
```

**Or create `agent/.env` file (all platforms):**
```
SERVER_URL=http://192.168.1.10:3001
MACHINE_NAME=my-laptop
```

### 3. Run the Agent

```bash
npm run agent
```

The agent will report sessions from this machine to the central server every 5 seconds.

### 4. Verify

Go back to the dashboard (http://<server-ip>:5173) and you should now see sessions from both machines!

## Running Agent in Background

### macOS/Linux (using nohup)

```bash
nohup npm run agent > /tmp/claude-agent.log 2>&1 &
```

### macOS (using launchd)

Create `~/Library/LaunchAgents/com.claude.dash.agent.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude.dash.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/claude-dash/agent/index.ts</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>SERVER_URL</key>
        <string>http://192.168.1.10:3001</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Then:
```bash
launchctl load ~/Library/LaunchAgents/com.claude.dash.agent.plist
```

## Troubleshooting

### Agent can't connect to server

- Check server is running: `curl http://<server-ip>:3001/api/health`
- Verify firewall allows port 3001
- Ensure machines are on same network
- Try server IP instead of hostname

### No sessions appearing

- Verify Claude Code is actually running
- Check `~/.claude/ide/*.lock` files exist
- Look at agent logs for errors
- Check server logs in terminal

### Sessions show as inactive

- Sessions expire after 30 seconds of no updates
- Ensure agent is still running
- Check network connectivity
