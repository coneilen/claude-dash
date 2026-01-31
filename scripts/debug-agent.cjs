#!/usr/bin/env node
// Debug script to check Claude session detection on Windows/Mac

const os = require('os');
const path = require('path');
const fs = require('fs');

console.log('=== Claude Dash Debug ===\n');
console.log('Platform:', process.platform);
console.log('OS:', os.type(), os.release());
console.log('Home directory:', os.homedir());
console.log('Hostname:', os.hostname());
console.log('');

const claudeDir = path.join(os.homedir(), '.claude');
const ideDir = path.join(claudeDir, 'ide');
const historyFile = path.join(claudeDir, 'history.jsonl');

console.log('Claude directory:', claudeDir);
console.log('  Exists:', fs.existsSync(claudeDir));

if (fs.existsSync(claudeDir)) {
  const items = fs.readdirSync(claudeDir);
  console.log('  Contents:', items.slice(0, 10).join(', '), items.length > 10 ? '...' : '');
}

console.log('');
console.log('IDE directory:', ideDir);
console.log('  Exists:', fs.existsSync(ideDir));

if (fs.existsSync(ideDir)) {
  const files = fs.readdirSync(ideDir);
  const lockFiles = files.filter(f => f.endsWith('.lock'));
  console.log('  Lock files found:', lockFiles.length);

  if (lockFiles.length > 0) {
    console.log('  Lock file names:', lockFiles.join(', '));

    // Try to read first lock file
    const firstLock = path.join(ideDir, lockFiles[0]);
    try {
      const content = fs.readFileSync(firstLock, 'utf-8');
      const parsed = JSON.parse(content);
      console.log('  Sample lock file:');
      console.log('    PID:', parsed.pid);
      console.log('    Workspace:', parsed.workspaceFolders?.[0]);
      console.log('    IDE:', parsed.ideName);

      // Check if process is running
      console.log('    Process check...');
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        try {
          const output = execSync(`tasklist /FI "PID eq ${parsed.pid}" /NH`, { encoding: 'utf-8' });
          console.log('    Process output:', output.trim().substring(0, 100));
          console.log('    Process running:', output.toLowerCase().includes('node') || output.toLowerCase().includes('code'));
        } catch (e) {
          console.log('    Process check error:', e.message);
        }
      } else {
        try {
          process.kill(parsed.pid, 0);
          console.log('    Process running: true');
        } catch {
          console.log('    Process running: false');
        }
      }
    } catch (e) {
      console.log('  Error reading lock file:', e.message);
    }
  }
} else {
  console.log('  IDE directory does not exist!');
}

console.log('');
console.log('History file:', historyFile);
console.log('  Exists:', fs.existsSync(historyFile));

if (fs.existsSync(historyFile)) {
  const lines = fs.readFileSync(historyFile, 'utf-8').trim().split('\n');
  console.log('  Total entries:', lines.length);
  if (lines.length > 0) {
    try {
      const lastEntry = JSON.parse(lines[lines.length - 1]);
      console.log('  Last entry:');
      console.log('    Display:', lastEntry.display?.substring(0, 50));
      console.log('    Project:', lastEntry.project);
      console.log('    Session ID:', lastEntry.sessionId);
    } catch (e) {
      console.log('  Error parsing last entry:', e.message);
    }
  }
}

console.log('\n=== End Debug ===');
