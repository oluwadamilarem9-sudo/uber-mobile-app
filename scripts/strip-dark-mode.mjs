import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_DIRS = ['app', 'components', 'src'].map((d) => path.join(ROOT, d));

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) files.push(p);
  }
  return files;
}

let changed = 0;
for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
  const src = fs.readFileSync(file, 'utf8');
  const next = src
    .replace(/\s+dark:[^\s"`]+/g, '')
    .replace(/\s+hidden dark:flex/g, '')
    .replace(/\s+dark:hidden/g, '');
  if (next !== src) {
    fs.writeFileSync(file, next);
    changed++;
    console.log('updated', path.relative(ROOT, file));
  }
  }
}

console.log(`Done. ${changed} files updated.`);
