import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist', 'web');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const relativePath of [
  'privacy.html',
  'assets',
  'styles/desktop.css',
  'styles/compact.css',
  'src/web-entry.js',
  'src/core',
  'src/ui/desktop/template.html',
  'src/ui/desktop/app.js',
  'src/ui/compact/template.html',
  'src/ui/compact/app.js',
]) {
  await cp(path.join(root, relativePath), path.join(dist, relativePath), { recursive: true });
}

await writeFile(path.join(dist, 'index.html'), `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#193540">
  <title>TGCF</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="src/web-entry.js"></script>
</body>
</html>
`);

console.log(`Responsive web bundle ready: ${path.relative(root, dist)}`);
