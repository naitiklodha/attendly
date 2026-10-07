import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const src = new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url);
const outDir = new URL('../public/', import.meta.url);
if (!existsSync(src)) {
  console.error('[postinstall] pdfjs-dist missing — run `npm install` first.');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
copyFileSync(src, new URL('pdf.worker.min.mjs', outDir));
console.log('[postinstall] copied pdf.worker.min.mjs -> public/');
