import { pkg } from '#lib/package-json.ts'
import { getCommand } from '#lib/package-managers.ts'
import { $, detectPackageManager } from '#lib/utils.ts'
import { defineCommand } from 'citty'
import consola from 'consola'

export const remove = defineCommand({
	meta: {
		name: 'remove',
		description: 'Remove dependencies',
	},

	args: {
		deps: {
			type: 'positional',
			description: 'Dependencies to remove',
			required: false,
		},
	},

	run: (c) => removeDeps(c.args.deps),
})

async function removeDeps(deps?: string) {
	if (deps) {
		const pm = await detectPackageManager()
		$(getCommand(pm, 'remove', deps))
		return
	}

	const options = Object.entries({
		...pkg.dependencies,
		...pkg.devDependencies,
	}).map(([key, val]) => ({
		label: key!,
		value: key!,
		hint: val!,
	}))

	const depsToDelete = await consola.prompt('Select dependencies to remove:', {
		type: 'multiselect',
		options,
		cancel: 'default',
		initial: [],
	})

	if (!depsToDelete.length) {
		console.log('No dependencies selected')
		return
	}

	removeDeps(depsToDelete.join(' '))
}
