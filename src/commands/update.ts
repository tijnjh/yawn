import { getCommand } from '../lib/package-managers'
import { $, detectPackageManager } from '../lib/utils'
import { defineCommand } from 'citty'

export const update = defineCommand({
	meta: {
		name: 'update',
		description: 'Update dependencies',
	},

	args: {
		deps: {
			type: 'positional',
			description: 'Dependencies to update',
			required: true,
		},
	},

	async run(c) {
		const pm = await detectPackageManager()
		$(getCommand(pm, 'update', c.args.deps))
	},
})
