// Minimal esbuild build for the MV3 extension — three IIFE bundles
// (background / content / sidepanel) plus the static sidepanel.html + manifest.json.
// No framework plugin: esbuild alone is enough and far less version-fragile.
//
// Build-time config is injected via `define` with localhost dev defaults; set
// the env vars (see .env.example) to point at a deployed app/backend, e.g.
//   APP_ORIGIN=https://app.example.com API_BASE=https://api.example.com \
//   COGNITO_USER_POOL_ID=us-east-1_xxx COGNITO_CLIENT_ID=yyy npm run build:prod
import { build } from 'esbuild'
import { cpSync, mkdirSync, rmSync } from 'node:fs'

const dev = process.env.NODE_ENV !== 'production'

const define = {
  __API_BASE__: JSON.stringify(process.env.API_BASE ?? 'http://127.0.0.1:8000'),
  __APP_ORIGIN__: JSON.stringify(process.env.APP_ORIGIN ?? 'http://localhost:3000'),
  __COGNITO_CLIENT_ID__: JSON.stringify(process.env.COGNITO_CLIENT_ID ?? ''),
  __COGNITO_USER_POOL_ID__: JSON.stringify(process.env.COGNITO_USER_POOL_ID ?? ''),
  'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
}

rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })

const common = {
  bundle: true,
  define,
  format: 'iife',
  target: 'chrome114',
  logLevel: 'info',
  sourcemap: dev,
  minify: !dev,
  // KaTeX ships its stylesheet + web fonts. The `file` loader copies each font into
  // dist/ and rewrites the url() in the emitted CSS to the hashed filename, so the
  // bundled sidepanel.css reaches them by relative path (CSS + fonts co-locate in
  // dist/, so no publicPath is needed).
  loader: { '.woff2': 'file', '.woff': 'file', '.ttf': 'file' },
}

await build({ ...common, entryPoints: ['src/background.ts'], outfile: 'dist/background.js' })
await build({ ...common, entryPoints: ['src/content/extract.ts'], outfile: 'dist/content.js' })
await build({ ...common, entryPoints: ['src/content/fab.ts'], outfile: 'dist/fab.js' })
await build({
  ...common,
  entryPoints: ['src/panel/sidepanel.tsx'],
  outfile: 'dist/sidepanel.js',
  jsx: 'automatic',
})

cpSync('public', 'dist', { recursive: true })
cpSync('manifest.json', 'dist/manifest.json')
console.log('built → extension/dist/  (load this folder as an unpacked extension)')
