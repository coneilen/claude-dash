import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'
import { LocalSession, LockFile, HistoryEntry } from './types.js'
import { getGitInfo } from './git-info.js'

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const IDE_DIR = path.join(CLAUDE_DIR, 'ide')
const HISTORY_FILE = path.join(CLAUDE_DIR, 'history.jsonl')
const DEBUG_DIR = path.join(CLAUDE_DIR, 'debug')

// Normalize path for case-insensitive comparison on Windows
function normalizePath(p: string): string {
  return process.platform === 'win32' ? p.toLowerCase() : p
}

export async function getActiveSessions(): Promise<LocalSession[]> {
  try {
    // Read all lock files to find active sessions
    const lockFiles = await readLockFiles()
    console.log(`[claude-monitor] Found ${lockFiles.length} active lock file(s)`)

    // Read history to get session titles and message counts
    const historyMap = await readHistory()
    const sessionMessageCounts = await getSessionMessageCounts()
    console.log(`[claude-monitor] History map has ${historyMap.size} workspace(s)`)
    if (historyMap.size > 0) {
      console.log(`[claude-monitor] History workspaces:`, Array.from(historyMap.keys()))
    }
    console.log(`[claude-monitor] Session message counts: ${sessionMessageCounts.size} session(s)`)

    // Build LocalSession objects - one per (lockFile, workspace) pair
    const sessions: LocalSession[] = []

    for (const lockFile of lockFiles) {
      for (const workspaceFolder of lockFile.workspaceFolders) {
        console.log(`[claude-monitor] Processing workspace: ${workspaceFolder}`)

        // Find the most recent history entry for this workspace
        // Use normalized path for case-insensitive lookup on Windows
        const normalizedWorkspace = normalizePath(workspaceFolder)
        console.log(`[claude-monitor] Looking up workspace: ${workspaceFolder}`)
        console.log(`[claude-monitor] Normalized to: ${normalizedWorkspace}`)
        const workspaceHistory = historyMap.get(normalizedWorkspace) || []
        console.log(`[claude-monitor] Found ${workspaceHistory.length} history entry/entries for this workspace`)
        const mostRecentEntry = workspaceHistory[workspaceHistory.length - 1]
        if (mostRecentEntry) {
          console.log(`[claude-monitor] ✓ Session ID: ${mostRecentEntry.sessionId}`)
          console.log(`[claude-monitor] ✓ Title: "${mostRecentEntry.display.substring(0, 50)}"`)
        } else {
          console.log(`[claude-monitor] ⚠ No history found - will use default title "New Session"`)
        }

        // Get git info
        const gitInfo = await getGitInfo(workspaceFolder)

        // Get current activity from debug logs
        const currentActivity = await getCurrentActivity(mostRecentEntry?.sessionId)

        // Get message count for this session
        const sessionId = mostRecentEntry?.sessionId || lockFile.authToken
        const messageCount = sessionMessageCounts.get(sessionId) || 0

        const session: LocalSession = {
          sessionId,
          title: mostRecentEntry?.display || 'New Session',
          workspaceFolder,
          gitRepo: gitInfo.repoName,
          gitBranch: gitInfo.branch,
          currentActivity,
          lastActive: mostRecentEntry?.timestamp || Date.now(),
          isActive: true,
          ideName: lockFile.ideName,
          pid: lockFile.pid,
          messageCount
        }

        sessions.push(session)
      }
    }

    console.log(`[claude-monitor] Created ${sessions.length} session(s) from ${lockFiles.length} lock file(s)`)

    // Sort by last active (most recent first)
    sessions.sort((a, b) => b.lastActive - a.lastActive)

    return sessions
  } catch (error) {
    console.error('Error getting active sessions:', error)
    return []
  }
}

async function readLockFiles(): Promise<LockFile[]> {
  try {
    if (!fs.existsSync(IDE_DIR)) {
      return []
    }

    const files = fs.readdirSync(IDE_DIR)
    const lockFiles: LockFile[] = []

    for (const file of files) {
      if (file.endsWith('.lock')) {
        const filePath = path.join(IDE_DIR, file)
        const content = fs.readFileSync(filePath, 'utf-8')

        try {
          const lockFile: LockFile = JSON.parse(content)

          // Verify process is still running
          if (isProcessRunning(lockFile.pid)) {
            lockFiles.push(lockFile)
          }
        } catch (e) {
          console.error(`Error parsing lock file ${file}:`, e)
        }
      }
    }

    return lockFiles
  } catch (error) {
    console.error('Error reading lock files:', error)
    return []
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    if (process.platform === 'win32') {
      // On Windows, use tasklist to check if process exists
      const output = execSync(`tasklist /FI "PID eq ${pid}" /NH`, { encoding: 'utf-8' })
      console.log(`[claude-monitor] Process check for PID ${pid}:`, output.trim().substring(0, 60))
      const isRunning = output.toLowerCase().includes('node') || output.toLowerCase().includes('code')
      console.log(`[claude-monitor] PID ${pid} running: ${isRunning}`)
      return isRunning
    } else {
      // On Unix-like systems, send signal 0 to check if process exists
      process.kill(pid, 0)
      return true
    }
  } catch (e) {
    console.log(`[claude-monitor] Process check failed for PID ${pid}:`, e instanceof Error ? e.message : e)
    return false
  }
}

async function readHistory(): Promise<Map<string, HistoryEntry[]>> {
  const historyMap = new Map<string, HistoryEntry[]>()

  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return historyMap
    }

    const content = fs.readFileSync(HISTORY_FILE, 'utf-8')
    const lines = content.trim().split('\n')

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const entry: HistoryEntry = JSON.parse(line)

        // Normalize path for case-insensitive comparison on Windows
        const normalizedProject = normalizePath(entry.project)

        if (!historyMap.has(normalizedProject)) {
          historyMap.set(normalizedProject, [])
        }

        historyMap.get(normalizedProject)!.push(entry)
      } catch (e) {
        // Skip malformed lines
      }
    }

    return historyMap
  } catch (error) {
    console.error('Error reading history:', error)
    return historyMap
  }
}

async function getCurrentActivity(sessionId?: string): Promise<string> {
  if (!sessionId) {
    return 'Starting...'
  }

  try {
    const debugFile = path.join(DEBUG_DIR, `${sessionId}.txt`)

    if (!fs.existsSync(debugFile)) {
      return 'Active'
    }

    // Read last few lines of debug file to get current activity
    const content = fs.readFileSync(debugFile, 'utf-8')
    const lines = content.trim().split('\n')

    // Get last 20 lines and look for tool usage or activity indicators
    const recentLines = lines.slice(-20)

    // Look for tool usage patterns
    for (let i = recentLines.length - 1; i >= 0; i--) {
      const line = recentLines[i]

      // Look for tool invocations
      if (line.includes('Tool:')) {
        const toolMatch = line.match(/Tool:\s*(\w+)/)
        if (toolMatch) {
          return `Using ${toolMatch[1]} tool`
        }
      }

      // Look for file operations
      if (line.includes('Reading file:') || line.includes('read file')) {
        return 'Reading files'
      }
      if (line.includes('Writing file:') || line.includes('write file')) {
        return 'Writing files'
      }
      if (line.includes('Editing file:') || line.includes('edit file')) {
        return 'Editing files'
      }

      // Look for bash commands
      if (line.includes('Running command:') || line.includes('bash:')) {
        return 'Running commands'
      }

      // Look for agent/task activity
      if (line.includes('Agent:') || line.includes('Task:')) {
        return 'Running agent'
      }
    }

    return 'Active'
  } catch (error) {
    return 'Active'
  }
}

async function getSessionMessageCounts(): Promise<Map<string, number>> {
  const messageCounts = new Map<string, number>()

  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return messageCounts
    }

    const content = fs.readFileSync(HISTORY_FILE, 'utf-8')
    const lines = content.trim().split('\n')

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const entry: HistoryEntry = JSON.parse(line)

        if (entry.sessionId) {
          const currentCount = messageCounts.get(entry.sessionId) || 0
          messageCounts.set(entry.sessionId, currentCount + 1)
        }
      } catch (e) {
        // Skip malformed lines
      }
    }

    return messageCounts
  } catch (error) {
    console.error('Error counting session messages:', error)
    return messageCounts
  }
}
