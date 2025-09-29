#!/usr/bin/env node

import { spawn } from 'child_process';
import nodemon from 'nodemon';
import { exec } from 'child_process';

let currentInspector = null;
let isShuttingDown = false;
let isBuilding = false;
let cleanupInProgress = false;

// Function to kill all node processes running the inspector
function killAllInspectors() {
  return new Promise((resolve) => {
    let resolved = false;

    const handleResolve = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    if (process.platform === 'win32') {
      exec(
        'taskkill /F /IM node.exe /FI "WINDOWTITLE eq @modelcontextprotocol/inspector*"',
        handleResolve,
      );
    } else {
      exec('pkill -f "@modelcontextprotocol/inspector"', handleResolve);
    }

    // Fallback timeout in case exec doesn't call callback
    setTimeout(handleResolve, 300);
  });
}

// Function to run the inspector
function startInspector() {
  if (isShuttingDown || isBuilding || currentInspector) return null;

  console.log('🔍 Starting MCP Inspector...', {
    isShuttingDown,
    isBuilding,
    currentInspector: !!currentInspector,
  });
  const inspector = spawn('npm', ['run', 'inspect'], {
    stdio: 'inherit',
    shell: true,
  });

  inspector.on('error', (err) => {
    console.error('❌ Inspector failed to start:', err);
    console.log('🔍 Setting currentInspector to null due to error');
    currentInspector = null;
  });

  inspector.on('exit', (code, signal) => {
    console.log(`🔍 Inspector exited with code ${code}, signal ${signal}`);
    if (currentInspector === inspector) {
      console.log('🔍 Setting currentInspector to null due to exit');
      currentInspector = null;
    }
  });

  return inspector;
}

// Cleanup function
async function cleanup() {
  if (cleanupInProgress) return;

  console.log('🧹 Cleaning up...');
  cleanupInProgress = true;
  isShuttingDown = true;

  if (currentInspector) {
    currentInspector.kill('SIGTERM');
    currentInspector = null;
  }

  await killAllInspectors();

  // Stop nodemon and exit
  if (nodemon) {
    nodemon.emit('quit');
  }

  setTimeout(() => {
    process.exit(0);
  }, 200);
}

console.log('👀 Watching for changes in src/ directory...');
console.log('Press Ctrl+C to stop');

// Set up nodemon to watch the src directory
const mon = nodemon({
  watch: ['src'],
  ext: 'ts',
  exec: 'npm run build',
  delay: 200,
});

let buildCount = 0;

// Handle nodemon events
mon
  .on('start', () => {
    if (isShuttingDown) return;
    buildCount++;
    console.log(`🚀 Starting build #${buildCount}...`);
    console.log('🔍 Inspector state at build start:', !!currentInspector);
    isBuilding = true;
  })
  .on('restart', async (files) => {
    if (isShuttingDown) return;

    buildCount++;
    console.log(
      '📁 Files changed:',
      Array.isArray(files) ? files.join(', ') : 'Multiple files',
    );
    console.log(`🔄 Rebuilding #${buildCount}...`);
    console.log('🔍 Inspector state at restart:', !!currentInspector);
    isBuilding = true;
  })
  .on('quit', () => {
    if (!isShuttingDown) {
      console.log('👋 Nodemon stopped');
      cleanup();
    }
  })
  .on('crash', () => {
    console.error('💥 Build crashed');
    isBuilding = false;
  })
  .on('exit', (code) => {
    if (isShuttingDown) return;

    // Simple success check
    const isSuccess = !code || code === 0;
    console.log('🔍 Inspector state at build exit:', !!currentInspector);

    if (isSuccess) {
      console.log(`✅ Build #${buildCount} completed successfully`);
      isBuilding = false;

      // Start inspector after a delay if not shutting down

      if (!isShuttingDown && !currentInspector && !isBuilding) {
        currentInspector = startInspector();
        console.log('🔍 Inspector started', !!currentInspector);
      } else {
        console.log('🔍 Skipping inspector since already running');
      }
    } else {
      console.error(`❌ Build #${buildCount} failed with code ${code}`);
      isBuilding = false;
    }
  });

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGHUP', cleanup);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught exception:', err);
  cleanup();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled promise rejection:', reason);
  cleanup();
});
