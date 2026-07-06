#!/usr/bin/env node

import { runMain, type CommandDef } from 'citty'
import { readFileSync } from 'node:fs'

const yawnPkgJson = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string }

export const main = {
	meta: {
		name: 'yawn',
		version: yawnPkgJson.version,
		description: '😴',
	},
	subCommands: {
		install: import('./commands/install.ts').then((m) => m.install),
		add: import('./commands/add.ts').then((m) => m.add),
		update: import('./commands/update.ts').then((m) => m.update),
		run: import('./commands/run.ts').then((m) => m.run),
		remove: import('./commands/remove.ts').then((m) => m.remove),
		dlx: import('./commands/dlx.ts').then((m) => m.dlx),
	},
} satisfies CommandDef

runMain(main)
