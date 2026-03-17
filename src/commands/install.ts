import { getCommand } from '../lib/package-managers'
import { $, detectPackageManager } from '../lib/utils'
import { defineCommand } from 'citty'

export const install = defineCommand({
	meta: {
		name: 'install',
		description: 'Install dependencies',
	},

	async run() {
		const pm = await detectPackageManager()
		$(getCommand(pm, 'install'))
	},
})
