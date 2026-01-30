export interface ClaudeSession {
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
  machineName: string
  messageCount: number
}

export interface SessionsResponse {
  sessions: ClaudeSession[]
}
