import express from 'express'
import cors from 'cors'
import * as os from 'os'
import { getActiveSessions } from './claude-monitor.js'
import { ClaudeSession } from './types.js'

const app = express()
const PORT = 3001
const SESSION_EXPIRY_MS = 30000 // 30 seconds

// In-memory storage for sessions from all machines
const sessionStore = new Map<string, ClaudeSession>()

// Middleware
app.use(cors())
app.use(express.json())

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, session] of sessionStore.entries()) {
    if (now - session.lastActive > SESSION_EXPIRY_MS) {
      sessionStore.delete(key)
    }
  }
}, 10000) // Clean up every 10 seconds

// API Routes

// POST endpoint for agents to report sessions
app.post('/api/sessions/report', (req, res) => {
  try {
    const sessions: ClaudeSession[] = req.body.sessions

    if (!Array.isArray(sessions)) {
      return res.status(400).json({ error: 'Invalid request: sessions must be an array' })
    }

    // Store sessions with composite key (machineName + sessionId)
    for (const session of sessions) {
      const key = `${session.machineName}:${session.sessionId}`
      sessionStore.set(key, session)
    }

    res.json({ success: true, received: sessions.length })
  } catch (error) {
    console.error('Error receiving sessions:', error)
    res.status(500).json({ error: 'Failed to process sessions' })
  }
})

// GET endpoint to retrieve all sessions (for dashboard)
app.get('/api/sessions', async (req, res) => {
  try {
    // Get local sessions (this server's machine)
    const localSessions = await getActiveSessions()
    const machineName = os.hostname()

    // Add machine name to local sessions
    const localSessionsWithMachine = localSessions.map(s => ({
      ...s,
      machineName
    }))

    // Update store with local sessions
    for (const session of localSessionsWithMachine) {
      const key = `${session.machineName}:${session.sessionId}`
      sessionStore.set(key, session)
    }

    // Return all sessions from all machines
    const allSessions = Array.from(sessionStore.values())

    // Sort by last active
    allSessions.sort((a, b) => b.lastActive - a.lastActive)

    res.json({ sessions: allSessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    res.status(500).json({ error: 'Failed to fetch sessions' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Claude Dash server running on http://0.0.0.0:${PORT}`)
  console.log(`Machine: ${os.hostname()}`)
  console.log(`API available at http://localhost:${PORT}/api/sessions`)
  console.log(`\nOther machines should configure agent with:`)
  console.log(`SERVER_URL=http://<this-machine-ip>:${PORT}`)
})
