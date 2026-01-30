import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders heading', () => {
    render(<App />)
    expect(screen.getByText('Claude Dash')).toBeInTheDocument()
  })

  it('increments count when button is clicked', () => {
    render(<App />)
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('count is 0')

    fireEvent.click(button)
    expect(button).toHaveTextContent('count is 1')
  })
})
