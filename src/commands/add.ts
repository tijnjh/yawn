import { getCommand } from '../lib/package-managers.ts'
import { execute, detectPackageManager } from '../lib/utils.ts'
import { defineCommand } from 'citty'

export const add = defineCommand({
	meta: {
		name: 'add',
		description: 'Add a dependency',
	},

	args: {
		deps: {
			type: 'positional',
			description: 'Dependencies to add',
			required: true,
		},
	},

	async run(c) {
		const pm = await detectPackageManager()
		execute(getCommand(pm, 'add', c.args.deps))
	},
})
