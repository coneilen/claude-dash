// Base session data without machine name (returned by claude-monitor)
export interface LocalSession {
  sessionId: string
  title: string
  workspaceFolder: string
  gitRepo: string | null
  gitBranch: string | null
  currentActivity: string
  lastActive: number
  isActive: boolean
  ideName: string
  pid: number
  messageCount: number
}

// Complete session data with machine name (used by server/agent)
export interface ClaudeSession extends LocalSession {
  machineName: string
}

export interface LockFile {
  pid: number
  workspaceFolders: string[]
  ideName: string
  transport: string
  runningInWindows: boolean
  authToken: string
}

export interface HistoryEntry {
  display: string
  pastedContents: Record<string, unknown>
  timestamp: number
  project: string
  sessionId: string
}

export interface GitInfo {
  repoName: string | null
  branch: string | null
  isDirty: boolean
}
