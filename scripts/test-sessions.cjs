#!/usr/bin/env node
// Test script to verify session detection is working

const path = require('path');

// Dynamically import the ES module
async function test() {
  console.log('=== Testing Session Detection ===\n');

  try {
    // Import the monitoring module
    const { getActiveSessions } = await import('../server/claude-monitor.js');

    console.log('Calling getActiveSessions()...\n');
    const sessions = await getActiveSessions();

    console.log(`Found ${sessions.length} session(s)\n`);

    if (sessions.length === 0) {
      console.log('❌ No sessions found');
      console.log('\nPossible issues:');
      console.log('1. Claude Code not running');
      console.log('2. Lock files exist but processes not running');
      console.log('3. Path matching still failing');
      console.log('\nRun: npm run debug-agent');
    } else {
      console.log('✅ Sessions detected:\n');
      sessions.forEach((session, i) => {
        console.log(`Session ${i + 1}:`);
        console.log(`  Title: ${session.title.substring(0, 50)}`);
        console.log(`  Workspace: ${session.workspaceFolder}`);
        console.log(`  Git Repo: ${session.gitRepo || 'N/A'}`);
        console.log(`  Messages: ${session.messageCount}`);
        console.log(`  PID: ${session.pid}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nStack:', error.stack);
  }
}

test();
