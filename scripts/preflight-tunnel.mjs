/**
 * Quick tunnel test (ngrok v3 CLI from npm package).
 */
import { execSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
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

loadEnv();
console.log('Tunnel check (OtterRide)\n');

if (!fs.existsSync(ngrokBin)) {
  console.error('Run: npm install');
  process.exit(1);
}

const version = execSync(`"${ngrokBin}" version`, { encoding: 'utf8', windowsHide: true }).trim();
console.log('ngrok:', version);

const token = process.env.NGROK_AUTHTOKEN || process.env.NGROK_AUTH_TOKEN;
if (!token) {
  console.error('\nAdd NGROK_AUTHTOKEN to .env — see docs/EXPO_TUNNEL.md\n');
  process.exit(1);
}
console.log('NGROK_AUTHTOKEN: ok');

stopStaleNgrok();
spawnSync(ngrokBin, ['config', 'add-authtoken', token, `--config=${configPath}`], {
  cwd: root,
  windowsHide: true,
});

const proc = spawn(ngrokBin, ['http', '8081', `--config=${configPath}`, '--log=stdout'], {
  cwd: root,
  windowsHide: true,
});

let buf = '';
const url = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('timeout')), 60_000);
  const onData = (c) => {
    buf += c.toString();
    const m = buf.match(/url=(https:\/\/[^\s]+)/);
    if (m) {
      clearTimeout(t);
      resolve(m[1]);
    }
  };
  proc.stdout?.on('data', onData);
  proc.stderr?.on('data', onData);
  proc.on('exit', (code) => {
    if (code) reject(new Error(buf.slice(-800)));
  });
});

stopStaleNgrok();
proc.kill();

console.log('\nTunnel OK:', url);
console.log('\nRun:  npm run start:tunnel\n');
console.log('Do NOT use: npx expo start --tunnel\n');
