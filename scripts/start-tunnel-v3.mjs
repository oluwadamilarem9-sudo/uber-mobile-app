/**
 * Tunnel via ngrok v3 (bundled in npm package `ngrok@5`).
 * Does NOT use Expo's broken `expo start --tunnel` (ngrok 2.3.41).
 */
import { spawn, spawnSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { spawnExpo } from './spawn-expo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const port = Number(process.env.RCT_METRO_PORT || 8081);
const configPath = path.join(root, '.ngrok.yml');
const ngrokBin = path.join(root, 'node_modules', 'ngrok', 'bin', process.platform === 'win32' ? 'ngrok.exe' : 'ngrok');

function loadEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function stopStaleNgrok() {
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM ngrok.exe 2>nul', { stdio: 'ignore', windowsHide: true });
    }
  } catch {
    /* ignore */
  }
}

function ensureConfig(token) {
  const r = spawnSync(ngrokBin, ['config', 'add-authtoken', token, `--config=${configPath}`], {
    cwd: root,
    windowsHide: true,
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || 'ngrok config add-authtoken failed');
  }
}

function parseTunnelUrl(text) {
  const m = text.match(/url=(https:\/\/[^\s]+)/);
  return m?.[1] ?? null;
}

function waitForTunnelUrl(ngrokProc, timeoutMs = 120_000) {
  let buf = '';
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('ngrok did not start in time. Try: npm run check:tunnel'));
    }, timeoutMs);

    const onData = (chunk) => {
      buf += chunk.toString();
      process.stderr.write(chunk);
      const url = parseTunnelUrl(buf);
      if (url) {
        clearTimeout(timer);
        resolve(url);
      }
    };

    ngrokProc.stdout?.on('data', onData);
    ngrokProc.stderr?.on('data', onData);
    ngrokProc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timer);
        reject(new Error(buf.slice(-1500) || `ngrok exited with code ${code}`));
      }
    });
  });
}

loadEnv();
stopStaleNgrok();

if (!fs.existsSync(ngrokBin)) {
  console.error('Missing ngrok binary. Run: npm install');
  process.exit(1);
}

const token = process.env.NGROK_AUTHTOKEN || process.env.NGROK_AUTH_TOKEN;
if (!token) {
  console.error(`
Missing NGROK_AUTHTOKEN in .env

1. https://dashboard.ngrok.com/get-started/your-authtoken
2. Add: NGROK_AUTHTOKEN=your_token
3. npm run start:tunnel

Or same Wi-Fi: npm start
`);
  process.exit(1);
}

let tunnelUrl;
let ngrokProc;

try {
  ensureConfig(token);
  console.log('Starting ngrok v3 → localhost:' + port);

  ngrokProc = spawn(ngrokBin, ['http', String(port), `--config=${configPath}`, '--log=stdout'], {
    cwd: root,
    windowsHide: true,
  });

  tunnelUrl = await waitForTunnelUrl(ngrokProc);
} catch (err) {
  stopStaleNgrok();
  console.error('\n', err.message || err);
  console.error('\nTry: npm start  (same Wi-Fi, no tunnel)\n');
  process.exit(1);
}

const hostname = new URL(tunnelUrl).hostname;
console.log('\n  ngrok ready:', tunnelUrl);
console.log('  Starting Expo...\n');

const expo = spawnExpo(root, ['start', '--localhost', ...process.argv.slice(2)], {
  REACT_NATIVE_PACKAGER_HOSTNAME: hostname,
  EXPO_PACKAGER_PROXY_URL: tunnelUrl,
});

function cleanup() {
  stopStaleNgrok();
  try {
    ngrokProc?.kill();
  } catch {
    /* ignore */
  }
}

process.on('SIGINT', () => {
  cleanup();
  expo.kill('SIGINT');
});
process.on('SIGTERM', cleanup);
expo.on('exit', (code) => {
  cleanup();
  process.exit(code ?? 0);
});
