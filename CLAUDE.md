# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Dash is a monitoring dashboard for tracking active Claude Code sessions. It automatically detects running sessions by reading Claude's local data files (`~/.claude/`) and displays them in a card-based UI.

**Architecture:**
- **Central Server**: Express + TypeScript - Aggregates sessions from all machines, serves dashboard
- **Agent**: Lightweight monitor that runs on each machine, reports to central server
- **Frontend**: React + TypeScript + Vite - Card-based dashboard with auto-refresh

**Multi-Machine Support:**
- Run the server on one machine (monitors local sessions + receives data from other machines)
- Run the agent on each additional machine to report sessions to central server
- Works on local network - machines communicate via IP addresses

**Key Features:**
- Automatically detects active Claude sessions from lock files
- Displays machine name, session title, context usage, current activity, git repo, branch, and workspace
- Context usage tracking with visual progress bar (based on message count)
- Real-time updates every 5 seconds
- No user input required - everything is automatically discovered

## Development Commands

### Install Dependencies
```bash
npm install
```

### Development (Full Stack)
```bash
npm run dev:all
```
Starts both frontend (Vite at http://localhost:5173) and backend (Express at http://localhost:3001) concurrently.

### Development (Frontend Only)
```bash
npm run dev
```
Starts only the Vite dev server at http://localhost:5173.

### Development (Backend Only)
```bash
npm run dev:server
```
Starts only the Express server at http://localhost:3001 with auto-reload via tsx watch.

### Agent (for additional machines)
```bash
npm run agent
```
Runs the monitoring agent that reports local sessions to the central server. Configure with environment variables:
- `SERVER_URL` - Central server URL (e.g., `http://192.168.1.10:3001`)
- `MACHINE_NAME` - Optional custom machine name (defaults to hostname)
- `REPORT_INTERVAL` - Reporting interval in ms (defaults to 5000)

### Build
```bash
npm run build
```
Builds the frontend production bundle to `dist/`.

```bash
npm run build:server
```
Compiles the backend TypeScript to `dist-server/`.

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing.

### Type Checking
```bash
npm run type-check
```
Runs TypeScript compiler without emitting files to check for type errors.

### Linting
```bash
npm run lint
```
Runs ESLint on all TypeScript/TSX files.

### Testing
```bash
npm test
```
Runs Vitest in watch mode.

```bash
npm run test:ui
```
Opens Vitest UI for interactive test running and debugging.

## Architecture

### Build Tool: Vite
- Uses Vite for fast development and optimized production builds
- Configuration in `vite.config.ts`
- Supports HMR (Hot Module Replacement) for instant feedback

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Three tsconfig files:
  - `tsconfig.json`: Frontend React app configuration
  - `tsconfig.node.json`: Vite build tool configuration
  - `tsconfig.server.json`: Backend Express server configuration
- Frontend uses ES2020 target with ESNext modules
- Backend uses NodeNext module resolution for proper ESM support

### Testing Setup
- Vitest as the test runner (Jest-compatible API)
- React Testing Library for component testing
- Test setup in `src/setupTests.ts`
- Tests use `.test.tsx` extension

### Project Structure
```
src/
  main.tsx              # Application entry point
  App.tsx               # Root component
  types.ts              # TypeScript type definitions
  components/
    Dashboard.tsx       # Main dashboard with auto-refresh (polls every 5s)
    SessionCard.tsx     # Card component for individual sessions
    *.css               # Component-specific styles
  api/
    sessions.ts         # API client for backend communication

server/
  index.ts              # Express server - central aggregation point
  claude-monitor.ts     # Core logic for monitoring Claude sessions
  git-info.ts           # Git repository detection and info
  types.ts              # Shared TypeScript types

agent/
  index.ts              # Monitoring agent for remote machines
  config.example.env    # Example configuration file
```

### Data Flow

**Server Machine:**
1. Server monitors local `~/.claude/ide/*.lock` files to detect active sessions
2. Server reads local `~/.claude/history.jsonl` to get session titles
3. Server parses local `~/.claude/debug/*.txt` for current activity
4. Server receives session data from remote agents via POST `/api/sessions/report`
5. Server stores all sessions in memory (expires after 30s of inactivity)
6. Frontend polls `/api/sessions` every 5 seconds and displays cards

**Client Machines:**
1. Agent monitors local `~/.claude/` directory (same logic as server)
2. Agent adds machine hostname to session data
3. Agent POSTs session data to central server every 5 seconds
4. Server aggregates and displays all sessions from all machines

### Styling Approach
- CSS files co-located with components
- `index.css` contains global styles and theme variables (dark/light mode support)
- Component-specific styles in separate CSS files

### Entry Point
- `index.html` is the entry point
- Vite injects the compiled JavaScript via `<script type="module" src="/src/main.tsx">`
- React root mounted to `#root` div

## Code Conventions

### Component Structure
- Functional components with hooks
- TypeScript with explicit types
- Export default for main component

### File Organization
- Components in `src/` directory
- Co-locate component files (`.tsx`), styles (`.css`), and tests (`.test.tsx`)
- One component per file
