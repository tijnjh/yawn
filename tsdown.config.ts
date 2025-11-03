import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: ['./src/main.ts'],
	platform: 'node',
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
