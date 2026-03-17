import { getCommand } from '../lib/package-managers'
import { $, detectPackageManager } from '../lib/utils'
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
		$(getCommand(pm, 'add', c.args.deps))
	},
})
