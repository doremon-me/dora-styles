#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runInit } from './commands/init.js';
import { printHelp } from './commands/help.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package version safely
function getCLIVersion(): string {
  const pkgPath = path.resolve(__dirname, '../package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function main() {
  const args = process.argv.slice(2);

  const showHelp = args.includes('--help') || args.includes('-h');
  const showVersion = args.includes('--version') || args.includes('-v');

  if (showVersion) {
    console.log(`dora-styles version ${getCLIVersion()}`);
    process.exit(0);
  }

  if (showHelp || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'init':
      await runInit();
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main();
