import { getCommand } from '../lib/package-managers.ts'
import { detectPackageManager, execute } from '../lib/utils.ts'
import { defineCommand } from 'citty'

export const fallback = defineCommand({
	meta: { hidden: true },

	// args: {
	// 	script: {
	// 		type: 'positional',
	// 		description: 'Script to run',
	// 		required: false,
	// 	},
	// },

	async run(c) {
		// if (c.args.script) {
		// 	runScript(c.args.script) sadly we cant use it like this because the default command cannot have args
		// } else {
		const pm = await detectPackageManager()
		execute(getCommand(pm, 'install'))
		// }
	},
})
