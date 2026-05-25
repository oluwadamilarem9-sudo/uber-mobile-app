/**
 * Starts Expo on your LAN with the correct PC IP (for Expo Go on the same Wi-Fi).
 */
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { spawnExpo } from './spawn-expo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function getLanIpv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

const host = process.env.REACT_NATIVE_PACKAGER_HOSTNAME || getLanIpv4();
const port = process.env.RCT_METRO_PORT || '8081';

console.log('');
console.log('  OtterRide dev server (LAN — no ngrok)');
console.log('  -------------------------------------');
console.log(`  1. Phone and PC must use the SAME Wi-Fi`);
console.log(`  2. In Expo Go, scan the QR code OR enter manually:`);
console.log(`     exp://${host}:${port}`);
console.log('  3. Do NOT use --tunnel (broken ngrok v2 in Expo)');
console.log('');

const child = spawnExpo(root, ['start', '--lan', ...process.argv.slice(2)], {
  REACT_NATIVE_PACKAGER_HOSTNAME: host,
  EXPO_PACKAGER_PROXY_URL: `http://${host}:${port}`,
});

child.on('exit', (code) => process.exit(code ?? 0));
