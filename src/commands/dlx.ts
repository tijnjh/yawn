import { getCommand } from '#lib/package-managers.ts'
import { $, detectPackageManager } from '#lib/utils.ts'
import { defineCommand } from 'citty'

export const dlx = defineCommand({
	meta: {
		name: 'dlx',
		description: 'Run a script from a package',
	},

	args: {
		script: {
			type: 'positional',
			description: 'Script to run',
			required: true,
		},
	},

	async run(c) {
		const pm = await detectPackageManager()
		$(getCommand(pm, 'dlx', c.args._.join(' ')))
	},
})
