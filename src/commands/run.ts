import { pkg } from '../lib/package-json.ts'
import { getCommand } from '../lib/package-managers.ts'
import { execute, detectPackageManager } from '../lib/utils.ts'
import { defineCommand } from 'citty'
import consola from 'consola'
import didYouMean from 'didyoumean'

export const run = defineCommand({
	meta: {
		name: 'run',
		description: 'Run a script',
	},

	args: {
		script: {
			type: 'positional',
			description: 'Script to run',
			required: false,
		},
	},

	run: (c) => runScript(c.args.script),
})

async function runScript(script?: string) {
	if (!pkg.scripts) {
		consola.error('No scripts found')
		return
	}

	if (!script) {
		const scriptToRun = await consola.prompt('Select script to run:', {
			type: 'select',
			options: Object.entries({ ...pkg.scripts }).map(([key, val]) => ({
				label: key,
				value: key,
				hint: val,
			})),
			cancel: 'default',
			initial: undefined,
		})

		if (!scriptToRun) return

		await runScript(scriptToRun)
		return
	}

	if (pkg.scripts?.[script.split(' ')[0]!]) {
		const pm = await detectPackageManager()
		execute(getCommand(pm, 'run', script))
		return
	}

	const suggestion = didYouMean(script, Object.keys(pkg.scripts))

	if (suggestion) {
		const confirm = await consola.prompt(`Did you mean ${suggestion}?`, {
			type: 'confirm',
		})

		if (confirm) {
			await runScript(suggestion)
		}

		return
	}

	consola.error(`Couldn't find script: ${script}`)
}
