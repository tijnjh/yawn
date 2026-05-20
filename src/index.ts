import yawnPkgJson from '../package.json'
import { runMain, type CommandDef } from 'citty'

export const main = {
	meta: {
		name: 'yawn',
		version: yawnPkgJson.version,
		description: '😴',
	},
	subCommands: {
		install: import('./commands/install').then((m) => m.install),
		add: import('./commands/add').then((m) => m.add),
		update: import('./commands/update').then((m) => m.update),
		run: import('./commands/run').then((m) => m.run),
		remove: import('./commands/remove').then((m) => m.remove),
		dlx: import('./commands/dlx').then((m) => m.dlx),
	},
} satisfies CommandDef

runMain(main)
