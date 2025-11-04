import { pkg } from './package-json'
import { getCommand } from './package-managers'
import { $, type ClassMethods } from './utils'
import { detectPackageManager } from './utils'
import chalk from 'chalk'
import consola from 'consola'
import dedent from 'dedent'
import dym from 'didyoumean'

export type YawnMethods = keyof ClassMethods<Yawn>

export interface Command {
	id: YawnMethods
	aliases: string[]
	description: string
}

export const commands: Command[] = []

function command(c: Omit<Command, 'id'>) {
	return (_: any, propertyKey: YawnMethods) => {
		commands.push({
			id: propertyKey,
			aliases: [propertyKey, ...c.aliases],
			description: c.description,
		})
	}
}

export class Yawn {
	@command({
		aliases: ['help'],
		description: 'Display info',
	})
	info() {
		consola.box(
			commands
				.map(
					(command) =>
						dedent`${chalk.bold(`${chalk.bold(command.aliases[0])}, ${command.aliases.splice(1).join(', ')}`)}
						  ${chalk.gray(command.description)}`,
				)
				.join('\n\n'),
		)
	}

	@command({
		aliases: ['i', 'a', 'add'],
		description: 'Install dependencies',
	})
	async install(deps?: string[]) {
		const pm = await detectPackageManager()
		$(getCommand(pm, 'install', deps?.join(' ')))
	}

	@command({
		aliases: ['r'],
		description: 'Run a script',
	})
	async run([script]: string[]) {
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
			})

			this.run([scriptToRun])
			return
		}

		if (pkg.scripts?.[script]) {
			const pm = await detectPackageManager()
			$(getCommand(pm, 'run', script))
			return
		}

		const suggestion = dym(script, Object.keys(pkg.scripts))

		if (suggestion) {
			const confirm = await consola.prompt(`Did you mean ${suggestion}?`, {
				type: 'confirm',
			})

			if (confirm) {
				this.run([suggestion])
			}

			return
		}

		consola.error(`Unknown command: ${script}`)
	}

	@command({
		aliases: ['rm', 'un', 'uninstall'],
		description: 'Remove dependencies',
	})
	async remove(deps?: string[]) {
		const pm = await detectPackageManager()

		if (deps && deps.length) {
			$(getCommand(pm, 'remove', deps.join(' ')))
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

		const depsToDelete = await consola.prompt(
			'Select dependencies to remove:',
			{
				type: 'multiselect',
				options,
				cancel: 'default',
				initial: [],
			},
		)

		if (!depsToDelete.length) {
			console.log('No dependencies selected')
			return
		}

		$(getCommand(pm, 'remove', depsToDelete.join(' ')))
	}

	@command({
		aliases: ['x'],
		description: 'Run a script from a package',
	})
	async dlx(script: string[]) {
		const pm = await detectPackageManager()
		$(getCommand(pm, 'dlx', script.join(' ')))
	}
}
