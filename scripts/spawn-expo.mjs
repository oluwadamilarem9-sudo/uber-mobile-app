import { spawn } from 'node:child_process';
import path from 'node:path';

/**
 * Spawn Expo CLI without npx (fixes spawn EINVAL on Windows + Node 24).
 */
export function spawnExpo(root, args, env) {
  const expoCli = path.join(root, 'node_modules', 'expo', 'bin', 'cli');
  return spawn(process.execPath, [expoCli, ...args], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    windowsHide: true,
  });
}
