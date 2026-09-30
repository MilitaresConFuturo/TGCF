import { cp, mkdir, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Builds the plain static folder to upload to the web hosting (a new folder,
// e.g. public_html/herramientas/). Unlike build-web.js (Android/iOS bundle, with
// every stylesheet and font inlined), this keeps the files separate, exactly
// like the existing /TGCF/ folder, and ships ONLY what a browser needs: no
// android/, ios/, tests/ or scripts/. All links are relative, so the folder
// works under any name.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-hosting');

const INCLUDE = ['index.html', 'privacy.html', 'styles', 'src', 'assets', 'permanencia'];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const relativePath of INCLUDE) {
  await cp(path.join(root, relativePath), path.join(out, relativePath), { recursive: true });
}

async function count(dir) {
  let n = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? await count(path.join(dir, entry.name)) : 1;
  }
  return n;
}

console.log(`Hosting folder ready: ${path.relative(root, out)} (${await count(out)} files)`);
