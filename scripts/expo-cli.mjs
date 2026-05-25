#!/usr/bin/env node
/**
 * Wrapper so `npm run expo -- start --tunnel` uses ngrok v3 instead of Expo's broken tunnel.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { spawnExpo } from './spawn-expo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const args = process.argv.slice(2);

if (args.includes('--tunnel')) {
  console.error(`
\x1b[33m⚠  "expo start --tunnel" inside Expo uses ngrok 2.3.41 (broken).\x1b[0m
\x1b[32m→  Starting ngrok v3 tunnel instead...\x1b[0m
   (Use: npm run start:tunnel)\n`);
  const filtered = args.filter((a) => a !== '--tunnel' && a !== '--host' && a !== '-m');
  const child = spawn(process.execPath, [path.join(__dirname, 'start-tunnel-v3.mjs'), ...filtered], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  child.on('exit', (c) => process.exit(c ?? 0));
} else {
  const child = spawnExpo(root, args);
  child.on('exit', (c) => process.exit(c ?? 0));
}
