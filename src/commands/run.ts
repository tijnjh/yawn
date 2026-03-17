import { pkg } from '../lib/package-json'
import { getCommand } from '../lib/package-managers'
import { $, detectPackageManager } from '../lib/utils'
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
			required: true,
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

		runScript(scriptToRun)
		return
	}

	if (pkg.scripts?.[script.split(' ')[0]!]) {
		const pm = await detectPackageManager()
		$(getCommand(pm, 'run', script))
		return
	}

	const suggestion = didYouMean(script, Object.keys(pkg.scripts))

	if (suggestion) {
		const confirm = await consola.prompt(`Did you mean ${suggestion}?`, {
			type: 'confirm',
		})

		if (confirm) {
			runScript(suggestion)
		}

		return
	}

	consola.error(`Couldn't find script: ${script}`)
}
