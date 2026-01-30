import { SessionsResponse } from '../types'

const API_BASE_URL = 'http://localhost:3001/api'

export async function fetchSessions(): Promise<SessionsResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions`)

  if (!response.ok) {
    throw new Error('Failed to fetch sessions')
  }

  return response.json()
}

export async function checkHealth(): Promise<{ status: string; timestamp: number }> {
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error('Failed to check health')
  }

  return response.json()
}
