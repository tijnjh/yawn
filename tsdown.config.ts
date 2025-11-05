import pkg from './package.json' with { type: 'json' }
import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: ['./src/main.ts'],
	platform: 'node',
	format: 'cjs',
	outputOptions: {
		banner: `#!/usr/bin/env node
const YAWN_VERSION = '${pkg.version}'`,
	},
	noExternal: [
		'@effect/platform',
		'@effect/platform-node',
		'@types/node',
		'chalk',
		'consola',
		'dedent',
		'effect',
	],
})
