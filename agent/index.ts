#!/usr/bin/env node
import * as os from 'os'
import { getActiveSessions } from '../server/claude-monitor.js'

// Configuration - can be overridden with environment variables
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001'
const REPORT_INTERVAL = parseInt(process.env.REPORT_INTERVAL || '5000') // 5 seconds
const MACHINE_NAME = process.env.MACHINE_NAME || os.hostname()

console.log('Claude Dash Agent')
console.log('=================')
console.log(`Machine: ${MACHINE_NAME}`)
console.log(`Reporting to: ${SERVER_URL}`)
console.log(`Interval: ${REPORT_INTERVAL}ms`)
console.log('')

async function reportSessions() {
  try {
    // Get local sessions
    const sessions = await getActiveSessions()

    // Add machine name to each session
    const sessionsWithMachine = sessions.map(s => ({
      ...s,
      machineName: MACHINE_NAME
    }))

    // Send to central server
    const response = await fetch(`${SERVER_URL}/api/sessions/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessions: sessionsWithMachine })
    })

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`)
    }

    const result = await response.json()
    console.log(`[${new Date().toISOString()}] Reported ${result.received} session(s)`)
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error reporting sessions:`, error instanceof Error ? error.message : error)
  }
}

// Initial report
reportSessions()

// Report periodically
setInterval(reportSessions, REPORT_INTERVAL)

// Keep the process running
process.on('SIGINT', () => {
  console.log('\nAgent stopped')
  process.exit(0)
})

console.log('Agent started. Press Ctrl+C to stop.\n')
