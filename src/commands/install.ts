import { getCommand } from '#lib/package-managers.ts'
import { $, detectPackageManager } from '#lib/utils.ts'
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
