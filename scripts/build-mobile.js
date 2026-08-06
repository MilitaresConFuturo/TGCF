import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist', 'mobile');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const relativePath of [
  'privacy.html',
  'assets',
  'styles/compact.css',
  'src/core',
  'src/ui/compact/template.html',
  'src/ui/compact/app.js',
]) {
  await cp(path.join(root, relativePath), path.join(dist, relativePath), { recursive: true });
}

const template = await (await import('node:fs/promises')).readFile(path.join(root, 'src/ui/compact/template.html'), 'utf8');
await writeFile(path.join(dist, 'index.html'), `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#162b3c">
  <title>TGCF</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles/compact.css">
</head>
<body>
${template}
<script type="module" src="src/ui/compact/app.js"></script>
</body>
</html>
`);

console.log(`Compact mobile bundle ready: ${path.relative(root, dist)}`);
