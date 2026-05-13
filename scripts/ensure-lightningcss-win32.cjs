/**
 * NativeWind pulls in `lightningcss`. On Windows, the optional platform package
 * sometimes is not linked next to the nested `lightningcss` copy, so Metro fails
 * looking for `../lightningcss.win32-x64-msvc.node`. Copy from the hoisted
 * `lightningcss-win32-x64-msvc` package when present.
 */
const fs = require('fs');
const path = require('path');

if (process.platform !== 'win32' || process.arch !== 'x64') {
  process.exit(0);
}

const projectRoot = path.join(__dirname, '..');
const hoisted = path.join(
  projectRoot,
  'node_modules',
  'lightningcss-win32-x64-msvc',
  'lightningcss.win32-x64-msvc.node',
);
const nestedLightningDir = path.join(
  projectRoot,
  'node_modules',
  'react-native-css-interop',
  'node_modules',
  'lightningcss',
);
const nestedTarget = path.join(nestedLightningDir, 'lightningcss.win32-x64-msvc.node');

if (!fs.existsSync(hoisted)) {
  console.warn(
    '[postinstall] lightningcss-win32-x64-msvc not found; run `npm install` (optional dep may be missing).',
  );
  process.exit(0);
}

if (!fs.existsSync(nestedLightningDir)) {
  process.exit(0);
}

try {
  fs.copyFileSync(hoisted, nestedTarget);
  console.log('[postinstall] Copied lightningcss native binary next to nested lightningcss.');
} catch (e) {
  console.warn('[postinstall] Could not copy lightningcss binary:', e.message);
}

if (!fs.existsSync(nestedTarget)) {
  process.exit(0);
}

// If the binary exists but Windows cannot load it, the usual fix is VC++ Redistributable (not npm).
try {
  require(path.join(nestedLightningDir, 'node', 'index.js'));
} catch (e) {
  if (e && (e.code === 'ERR_DLOPEN_FAILED' || /specified module could not be found/i.test(String(e.message)))) {
    console.warn(
      '\n[postinstall] LightningCSS native addon failed to load (missing MSVC runtime DLLs is the usual cause).\n' +
        'Install **Microsoft Visual C++ Redistributable (x64)**, reboot the terminal, then run `npx expo start`:\n' +
        'https://aka.ms/vs/17/release/vc_redist.x64.exe\n',
    );
  }
}
