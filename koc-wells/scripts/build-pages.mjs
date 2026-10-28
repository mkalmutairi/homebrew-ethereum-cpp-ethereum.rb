// Builds the web version into ../docs for GitHub Pages
// (Settings → Pages → Deploy from a branch → this branch, /docs folder).
// The site lives under /<repo>/, so absolute asset paths are made relative.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const app = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(app, '..', 'docs');

rmSync(out, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir "${out}"`, { cwd: app, stdio: 'inherit' });

const indexPath = path.join(out, 'index.html');
let html = readFileSync(indexPath, 'utf8')
  .replace(/(src|href)="\/(?!\/)/g, '$1="./')
  .replace('<html lang="en">', '<html lang="ar">')
  .replace('</title>', `</title>
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="آبار الكويت" />
    <meta name="theme-color" content="#F4F6F8" />
    <link rel="apple-touch-icon" href="./icon.png" />`);
writeFileSync(indexPath, html);
copyFileSync(path.join(app, 'assets', 'icon.png'), path.join(out, 'icon.png'));
writeFileSync(path.join(out, '.nojekyll'), ''); // let Pages serve the _expo folder
rmSync(path.join(out, 'metadata.json'), { force: true });
console.log(`GitHub Pages site written to ${out}`);
