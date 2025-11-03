import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: ['./src/main.ts'],
	platform: 'node',
	format: 'cjs',
	outputOptions: {
		banner: '#!/usr/bin/env node',
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
