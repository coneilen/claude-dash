#!/bin/bash
# Helper script to find this machine's local IP address

echo "Claude Dash Server IP Addresses:"
echo "================================="
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS - Show all non-loopback IPv4 addresses
  echo "Available IP addresses:"
  ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print "  " $2}'
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  echo "Available IP addresses:"
  ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print "  " $2}' | cut -d/ -f1
else
  # Windows (in Git Bash or WSL)
  echo "Available IP addresses:"
  ipconfig | grep "IPv4" | awk '{print "  " $NF}'
fi

echo ""
echo "Use one of these IPs in your agent configuration:"
echo "  export SERVER_URL=http://<ip-address>:3001"
