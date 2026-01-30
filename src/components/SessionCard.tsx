import { ClaudeSession } from '../types'
import './SessionCard.css'

interface SessionCardProps {
  session: ClaudeSession
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function truncatePath(path: string, maxLength: number = 50): string {
  if (path.length <= maxLength) return path

  const parts = path.split('/')
  if (parts.length <= 3) return path

  // Show first part and last 2 parts
  return `${parts[0]}/.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`
}

function getContextLevel(messageCount: number): { level: 'low' | 'medium' | 'high', percentage: number } {
  // Rough approximation: most sessions stay under 200 messages
  // Low: 0-50, Medium: 51-150, High: 151+
  const percentage = Math.min((messageCount / 200) * 100, 100)

  if (messageCount <= 50) return { level: 'low', percentage }
  if (messageCount <= 150) return { level: 'medium', percentage }
  return { level: 'high', percentage }
}

export default function SessionCard({ session }: SessionCardProps) {
  const { level, percentage } = getContextLevel(session.messageCount)

  return (
    <div className="session-card">
      <div className="session-header">
        <h3 className="session-title">{session.title}</h3>
        <span className="session-status active">Active</span>
      </div>

      <div className="machine-badge">{session.machineName}</div>

      <div className="context-usage">
        <div className="context-label">
          <span>Context Usage</span>
          <span className="message-count">{session.messageCount} messages</span>
        </div>
        <div className="context-bar">
          <div
            className={`context-fill ${level}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="session-body">
        <div className="session-info-row">
          <span className="label">Activity:</span>
          <span className="value activity">{session.currentActivity}</span>
        </div>

        {session.gitRepo && (
          <div className="session-info-row">
            <span className="label">Repository:</span>
            <span className="value repo">{session.gitRepo}</span>
          </div>
        )}

        {session.gitBranch && (
          <div className="session-info-row">
            <span className="label">Branch:</span>
            <span className="value branch">{session.gitBranch}</span>
          </div>
        )}

        <div className="session-info-row">
          <span className="label">Workspace:</span>
          <span className="value workspace" title={session.workspaceFolder}>
            {truncatePath(session.workspaceFolder)}
          </span>
        </div>

        <div className="session-info-row">
          <span className="label">IDE:</span>
          <span className="value">{session.ideName}</span>
        </div>
      </div>

      <div className="session-footer">
        <span className="last-active">Last active: {formatTimestamp(session.lastActive)}</span>
        <span className="session-id">PID: {session.pid}</span>
      </div>
    </div>
  )
}
