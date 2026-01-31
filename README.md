# Claude Dash

A real-time monitoring dashboard for tracking active Claude Code sessions across multiple workspaces.

## Overview

Claude Dash automatically detects and monitors all active Claude Code sessions across multiple machines. It displays each session in a card-based view showing:

- **Machine name** - Which computer the session is running on
- **Session title** - From the initial conversation
- **Context usage** - Visual progress bar showing conversation depth (message count)
- **Current activity** - What Claude is working on
- **Git repository and branch** - Current repo and branch
- **Workspace folder** - Path to the workspace
- **IDE name and process ID**
- **Last active timestamp**

The context usage bar changes color based on conversation depth:
- 🟢 Green (0-50 messages) - Light usage
- 🟠 Orange (51-150 messages) - Moderate usage
- 🔴 Red (151+ messages) - Heavy usage

The dashboard auto-refreshes every 5 seconds with no user input required.

## Architecture

- **Central Server** - Runs on one machine, aggregates sessions from all machines
- **Agent** - Runs on each machine, monitors local `~/.claude/` and reports to server
- **Dashboard** - Web UI showing all sessions from all machines

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Active Claude Code sessions to monitor

### Installation

```bash
npm install
```

## Quick Start

### Option 1: Single Machine (Simplest)

```bash
npm run dev:all
```
Open http://localhost:5173 - monitors only this machine's sessions.

### Option 2: Multi-Machine (Recommended)

**Server machine:**
```bash
npm run dev:all        # Start server + dashboard
npm run server-ip      # Get your IP (e.g., 192.168.1.10)
```

**Each client machine:**

Mac/Linux:
```bash
npm install
SERVER_URL=http://192.168.1.10:3001 npm run agent
```

Windows (PowerShell):
```powershell
npm install
$env:SERVER_URL="http://192.168.1.10:3001"
npm run agent
```

Windows (Command Prompt):
```cmd
npm install
set SERVER_URL=http://192.168.1.10:3001
npm run agent
```

Open http://192.168.1.10:5173 on any machine to see all sessions!

## Detailed Setup

### Single Machine Setup

**Start both frontend and backend:**
```bash
npm run dev:all
```

This starts:
- Frontend at [http://localhost:5173](http://localhost:5173)
- Backend API at [http://localhost:3001](http://localhost:3001)

The server automatically monitors local Claude sessions on this machine.

### Multi-Machine Setup

#### On the Server Machine (one machine):

1. Start the central server:
```bash
npm run dev:server
```

2. Find your server's local IP address:

**Cross-platform (recommended):**
```bash
npm run server-ip
```

**Or manually:**
- Mac/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig | findstr IPv4`

3. Open the dashboard in your browser:
```bash
open http://localhost:5173
```

Or start both together:
```bash
npm run dev:all
```

#### On Each Client Machine:

1. Install claude-dash on the machine (clone this repo)
2. Install dependencies: `npm install`
3. Configure the agent to point to your server:

**Mac/Linux:**
```bash
export SERVER_URL=http://<server-ip>:3001
export MACHINE_NAME=my-laptop  # Optional
npm run agent
```

**Windows (PowerShell):**
```powershell
$env:SERVER_URL="http://<server-ip>:3001"
$env:MACHINE_NAME="my-laptop"  # Optional
npm run agent
```

**Windows (Command Prompt):**
```cmd
set SERVER_URL=http://<server-ip>:3001
set MACHINE_NAME=my-laptop
npm run agent
```

The agent will now report this machine's Claude sessions to the central server every 5 seconds.

**Tip:** Run the agent in the background or set up a systemd service (Linux) or launchd (macOS) to auto-start it.

### Build

```bash
npm run build
```

Builds the app for production to the `dist` folder.

### Testing

```bash
npm test
```

Run tests with Vitest.

```bash
npm run test:ui
```

Run tests with Vitest UI for a visual test runner.

### Linting

```bash
npm run lint
```

Lint the codebase with ESLint.

### Type Checking

```bash
npm run type-check
```

Run TypeScript compiler to check for type errors without emitting files.
