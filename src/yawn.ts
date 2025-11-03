import { pkg } from './package-json'
import { $, type ClassMethods } from './utils'
import { detectPackageManager } from './utils'
import chalk from 'chalk'
import consola from 'consola'
import dedent from 'dedent'
import dym from 'didyoumean'
import type { PackageJson } from 'type-fest'
import fs from "node:fs"

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
	private _store: Partial<{ pm: string; pkg: PackageJson }> = {}

	private get pm() {
		if (this._store.pm) {
			return this._store.pm
		}

		const packageManager = detectPackageManager()

		if (!packageManager) {
			throw new Error('No package manager found')
		}

		this._store.pm = packageManager
		return packageManager
	}

	private get pkg() {
		if (this._store.pkg) {
			return this._store.pkg
		}
		
		try {
			const packageJsonPath = `${process.cwd()}/package.json`
			const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8')
			const packageJson = JSON.parse(packageJsonContent)
			return packageJson as PackageJson
		} catch (error) {
			consola.fail(error)
		}

		if (!pkg) {
			throw new Error('No package.json found')
		}

		this._store.pkg = pkg
		return pkg
	}

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
	install(deps?: string[]) {
		if (deps && deps.length) {
			$(`${this.pm} install ${deps.join(' ')}`)
			return
		}
		$(`${this.pm} install`)
	}

	@command({
		aliases: ['r'],
		description: 'Run a script',
	})
	async run([script]: string[]) {
		if (!this.pkg.scripts) {
			consola.error('No scripts found')
			return
		}

		if (!script) {
			const options = Object.entries({ ...this.pkg.scripts }).map(
				([key, val]) => ({
					label: key!,
					value: key!,
					hint: val!,
				}),
			)

			const scriptToRun = await consola.prompt('Select script to run:', {
				type: 'select',
				options,
			})

			this.run([scriptToRun])

			return
		}

		if (this.pkg.scripts?.[script]) {
			$(`${this.pm} run ${script}`)
			return
		}

		const suggestion = dym(script, Object.keys(this.pkg.scripts))

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
		if (deps && deps.length) {
			$(`${this.pm} remove ${deps.join(' ')}`)
			return
		}

		const options = Object.entries({
			...this.pkg.dependencies,
			...this.pkg.devDependencies,
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
			},
		)

		if (!depsToDelete.length) {
			console.log('No dependencies selected')
			return
		}

		$(`${this.pm} remove ${depsToDelete.join(' ')}`)
	}

	@command({
		aliases: ['x'],
		description: 'Run a script from a package',
	})
	dlx(script: string[]) {
		let template = 'npx'

		switch (this.pm) {
			case 'bun':
				template = 'bun x %s'
				break
			case 'npm':
				template = 'npx %s'
				break
			case 'pnpm':
				template = 'pnpm dlx %s'
				break
			case 'yarn':
				template = 'npx %s'
				break
			case 'deno':
				template = 'deno run -A npm:%s'
				break
		}

		return $(template.replace('%s', script.join(' ')))
	}
}
