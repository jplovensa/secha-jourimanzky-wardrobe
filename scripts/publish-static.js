// Keep a ready-to-serve version at the repository root for branch-based Pages.
// Source lives in app/; generated index.html and site-assets/ must be committed.
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const html = await readFile(new URL('dist/index.html', root), 'utf8');
if (html.includes('/src/') || !html.includes('./site-assets/')) {
  throw new Error('Refusing to publish an unbundled HTML entry point.');
}
await mkdir(new URL('site-assets/', root), { recursive: true });
// Retain previous hashed bundles so already-open pages survive a deployment.
await cp(new URL('dist/site-assets/', root), new URL('site-assets/', root), { recursive: true });
await writeFile(new URL('index.html', root), html);
await writeFile(new URL('.nojekyll', root), '');
console.log(`Static Pages entry prepared at ${fileURLToPath(root)}index.html`);
