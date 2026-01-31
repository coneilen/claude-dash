import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { LocalSession, LockFile, HistoryEntry } from './types.js'
import { getGitInfo } from './git-info.js'

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const IDE_DIR = path.join(CLAUDE_DIR, 'ide')
const HISTORY_FILE = path.join(CLAUDE_DIR, 'history.jsonl')
const DEBUG_DIR = path.join(CLAUDE_DIR, 'debug')

interface SessionMap {
  [authToken: string]: {
    lockFile: LockFile
    workspaceFolder: string
  }
}

export async function getActiveSessions(): Promise<LocalSession[]> {
  try {
    // Read all lock files to find active sessions
    const lockFiles = await readLockFiles()

    // Read history to get session titles and message counts
    const historyMap = await readHistory()
    const sessionMessageCounts = await getSessionMessageCounts()

    // Build session map indexed by workspace folder
    const sessionMap: SessionMap = {}
    for (const lockFile of lockFiles) {
      for (const workspace of lockFile.workspaceFolders) {
        sessionMap[lockFile.authToken] = {
          lockFile,
          workspaceFolder: workspace
        }
      }
    }

    // Build LocalSession objects
    const sessions: LocalSession[] = []

    for (const [authToken, sessionData] of Object.entries(sessionMap)) {
      const { lockFile, workspaceFolder } = sessionData

      // Find the most recent history entry for this workspace
      const workspaceHistory = historyMap.get(workspaceFolder) || []
      const mostRecentEntry = workspaceHistory[workspaceHistory.length - 1]

      // Get git info
      const gitInfo = await getGitInfo(workspaceFolder)

      // Get current activity from debug logs
      const currentActivity = await getCurrentActivity(mostRecentEntry?.sessionId)

      // Get message count for this session
      const sessionId = mostRecentEntry?.sessionId || authToken
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
      const { execSync } = require('child_process')
      const output = execSync(`tasklist /FI "PID eq ${pid}" /NH`, { encoding: 'utf-8' })
      return output.toLowerCase().includes('node') || output.toLowerCase().includes('code')
    } else {
      // On Unix-like systems, send signal 0 to check if process exists
      process.kill(pid, 0)
      return true
    }
  } catch {
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

        if (!historyMap.has(entry.project)) {
          historyMap.set(entry.project, [])
        }

        historyMap.get(entry.project)!.push(entry)
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
