import * as esbuild from 'esbuild'
import { cpSync, mkdirSync } from 'node:fs'

mkdirSync('dist/operations', { recursive: true })
cpSync('operations', 'dist/operations', { recursive: true })

await esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/mcp.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'es2019',
  sourcemap: true,
})
