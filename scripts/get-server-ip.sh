#!/bin/bash
# Helper script to find this machine's local IP address

echo "Claude Dash Server IP Addresses:"
echo "================================="
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  echo "Available network interfaces:"
  ifconfig | grep -A 1 "en0\|en1" | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  echo "Available network interfaces:"
  ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1
else
  # Windows (in Git Bash or WSL)
  echo "Available network interfaces:"
  ipconfig | grep "IPv4" | awk '{print $NF}'
fi

echo ""
echo "Use one of these IPs in your agent configuration:"
echo "  export SERVER_URL=http://<ip-address>:3001"
