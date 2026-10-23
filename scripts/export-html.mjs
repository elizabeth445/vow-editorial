import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, writeFile, readdir, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(path.join(os.tmpdir(), 'wedding-html-'));
const output = path.join(root, 'html-export');
const mime = { '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const embed = async (asset) => {
  const bytes = await readFile(path.join(root, 'public', asset));
  return `data:${mime[path.extname(asset)]};base64,${bytes.toString('base64')}`;
};
try {
  await build({
    root, configFile: false, plugins: [react()], base: './',
    build: {
      outDir: temporary, emptyOutDir: true, copyPublicDir: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false,
      modulePreload: false,
      rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
    },
  });
  const assets = await readdir(path.join(temporary, 'assets'));
  let js = await readFile(path.join(temporary, 'assets', assets.find(name => name.endsWith('.js'))), 'utf8');
  let css = await readFile(path.join(temporary, 'assets', assets.find(name => name.endsWith('.css'))), 'utf8');
  let html = await readFile(path.join(temporary, 'index.html'), 'utf8');
  for (const asset of new Set(`${js}\n${css}\n${html}`.match(/\/(?:images\/[\w.-]+|favicon\.svg)/g) || [])) {
    const data = await embed(asset);
    js = js.replaceAll(asset, data);
    css = css.replaceAll(asset, data);
    html = html.replaceAll(asset, data);
  }
  html = html.replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/g, '')
    .replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, '')
    .replace('</head>', () => `<style>${css.replaceAll('</style', '<\\/style')}</style></head>`)
    .replace('</body>', () => `<script>${js.replaceAll('</script', '<\\/script')}</script></body>`);
  await mkdir(output, { recursive: true });
  const destination = path.join(output, 'wedding-invitation.html');
  await writeFile(destination, html);
  console.log(`Standalone HTML: ${destination} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB)`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
