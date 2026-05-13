/**
 * Windows + NativeWind (LightningCSS): if Metro errors with
 * "The specified module could not be found" for `lightningcss.win32-x64-msvc.node`,
 * the file is usually present but a **Microsoft Visual C++ runtime DLL** is missing.
 * Install **VC++ Redistributable x64**, restart the terminal, then `npx expo start`:
 * https://aka.ms/vs/17/release/vc_redist.x64.exe
 *
 * (Separate issue: Metro `import("C:\\...")` on Windows is patched via `patch-package`.)
 */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

module.exports = withNativeWind(config, { input: './global.css' });
