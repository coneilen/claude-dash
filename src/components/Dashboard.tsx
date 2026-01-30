import { useState, useEffect } from 'react'
import { ClaudeSession } from '../types'
import { fetchSessions } from '../api/sessions'
import SessionCard from './SessionCard'
import './Dashboard.css'

export default function Dashboard() {
  const [sessions, setSessions] = useState<ClaudeSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const loadSessions = async () => {
    try {
      setError(null)
      const data = await fetchSessions()
      setSessions(data.sessions)
      setLastUpdate(new Date())
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial load
    loadSessions()

    // Refresh every 5 seconds
    const interval = setInterval(loadSessions, 5000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Claude Dash</h1>
          <p>Monitoring Claude Code Sessions</p>
        </div>
        <div className="loading">Loading sessions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Claude Dash</h1>
          <p>Monitoring Claude Code Sessions</p>
        </div>
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={loadSessions}>Retry</button>
        </div>
      </div>
    )
  }

  const uniqueMachines = new Set(sessions.map(s => s.machineName)).size

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Claude Dash</h1>
        <p className="subtitle">Monitoring Claude Code Sessions</p>
        <div className="header-info">
          <span className="session-count">
            {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
          </span>
          <span className="machine-count">
            {uniqueMachines} machine{uniqueMachines !== 1 ? 's' : ''}
          </span>
          <span className="last-update">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="no-sessions">
          <p>No active Claude Code sessions detected</p>
          <p className="hint">Start Claude Code in VS Code to see sessions here</p>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions.map((session) => (
            <SessionCard key={session.sessionId} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}
