import { getCommand } from '#lib/package-managers.ts'
import { execute, detectPackageManager } from '#lib/utils.ts'
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
			required: false,
		},
	},

	async run(c) {
		const pm = await detectPackageManager()
		execute(getCommand(pm, 'update', c.args.deps))
	},
})
