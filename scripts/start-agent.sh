#!/bin/bash
# Quick start script for Claude Dash Agent

echo "Claude Dash Agent Setup"
echo "======================="
echo ""

# Check if SERVER_URL is set
if [ -z "$SERVER_URL" ]; then
  echo "Error: SERVER_URL environment variable not set"
  echo ""
  echo "Usage:"
  echo "  SERVER_URL=http://<server-ip>:3001 ./scripts/start-agent.sh"
  echo ""
  echo "Example:"
  echo "  SERVER_URL=http://192.168.1.10:3001 ./scripts/start-agent.sh"
  echo ""
  exit 1
fi

# Set default machine name if not provided
if [ -z "$MACHINE_NAME" ]; then
  export MACHINE_NAME=$(hostname)
  echo "Using machine name: $MACHINE_NAME"
fi

echo "Server URL: $SERVER_URL"
echo "Machine Name: $MACHINE_NAME"
echo ""

# Start the agent
npm run agent
