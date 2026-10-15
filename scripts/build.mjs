import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const result = await esbuild.build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: ['src/client.jsx'], bundle: true, write: false,
  format: 'cjs', platform: 'browser', target: 'es2022', jsx: 'automatic',
  external: ['react', 'react/*'], loader: { '.css': 'text' },
});
await mkdir(new URL('lib/', root), { recursive: true });
await writeFile(new URL('lib/client.js', root), `window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
${result.outputFiles[0].text}
    return module.exports;
  }
});\n`);
console.log('Built Codex style client bundle.');
