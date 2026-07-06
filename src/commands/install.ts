import { getCommand } from '../lib/package-managers.ts'
import { execute, detectPackageManager } from '../lib/utils.ts'
import { defineCommand } from 'citty'

export const install = defineCommand({
	meta: {
		name: 'install',
		description: 'Install dependencies',
		alias: ['i'],
	},

	async run() {
		const pm = await detectPackageManager()
		execute(getCommand(pm, 'install'))
	},
})
