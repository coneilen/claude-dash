#!/usr/bin/env node
// Cross-platform script to find this machine's local IP address

const os = require('os')

console.log('Claude Dash Server IP Addresses:')
console.log('=================================')
console.log('')

const interfaces = os.networkInterfaces()
const addresses = []

for (const name in interfaces) {
  for (const iface of interfaces[name]) {
    // Skip loopback, internal, and IPv6 addresses
    if (iface.family === 'IPv4' && !iface.internal) {
      addresses.push(iface.address)
    }
  }
}

if (addresses.length === 0) {
  console.log('No network interfaces found!')
  console.log('Make sure you are connected to a network.')
} else {
  console.log('Available IP addresses:')
  addresses.forEach(addr => console.log(`  ${addr}`))
}

console.log('')
console.log('Use one of these IPs in your agent configuration:')
console.log('  export SERVER_URL=http://<ip-address>:3001')
console.log('')
console.log('Windows (PowerShell):')
console.log('  $env:SERVER_URL="http://<ip-address>:3001"')
console.log('')
console.log('Windows (Command Prompt):')
console.log('  set SERVER_URL=http://<ip-address>:3001')
