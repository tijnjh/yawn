import { pkg } from './package-json'
import { PackageManager } from './schemas'
import { $, type ClassMethods } from './utils'
import { detectPackageManager } from './utils'
import chalk from 'chalk'
import consola from 'consola'
import dedent from 'dedent'
import { Effect, pipe } from 'effect'
import type { PackageJson } from 'type-fest'

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
	private constructor(
		private pm: PackageManager,
		private pkg: PackageJson,
	) {}

	static init = Effect.gen(function* () {
		const packageManager = yield* detectPackageManager

		if (!packageManager)
			return yield* Effect.fail(new Error('No package manager found'))

		if (!pkg) return yield* Effect.fail(new Error('No package.json found'))

		return new Yawn(packageManager, pkg)
	})

	@command({
		aliases: ['help'],
		description: 'Display info',
	})
	info() {
		return Effect.gen(this, function* () {
			consola.box({
				title: 'Yawn',
				message: dedent`
					${commands
						.map((command) => {
							return dedent`
  							${chalk.bold(command.id)}
  							${chalk.gray(command.aliases.join(', '))}${' '.repeat(Math.max(0, 40 - command.aliases.join(', ').length))} ${command.description}
         \n

					`
						})
						.join('\n')}
				`,
			})
		})
	}

	@command({
		aliases: ['i', 'a', 'add'],
		description: 'Install dependencies',
	})
	install(deps?: string[]) {
		return Effect.gen(this, function* () {
			if (deps && deps.length) {
				$(`${this.pm} install ${deps.join(' ')}`)
				return
			}
			$(`${this.pm} install`)
		})
	}

	@command({
		aliases: ['r'],
		description: 'Run a script',
	})
	run(script: string[]) {
		return Effect.gen(this, function* () {
			$(`${this.pm} run ${script[0]}`)
		})
	}

	@command({
		aliases: ['rm', 'delete', 'un', 'uninstall'],
		description: 'Remove dependencies',
	})
	remove(deps?: string[]) {
		return Effect.gen(this, function* () {
			if (deps && deps.length) {
				$(`${this.pm} remove ${deps.join(' ')}`)
				return
			}

			const options = pipe(
				{
					...this.pkg.dependencies,
					...this.pkg.devDependencies,
				},
				(v) =>
					Object.entries(v).map(([key, val]) => ({
						label: key!,
						value: key!,
						hint: val!,
					})),
			)

			const depsToDelete = yield* Effect.tryPromise({
				try: () =>
					consola.prompt('Select dependencies to remove:', {
						type: 'multiselect',
						options,
					}),
				catch: (error) => {
					consola.error(error)
					return []
				},
			})

			if (!depsToDelete.length) {
				console.log('No dependencies selected')
				return
			}

			$(`${this.pm} remove ${depsToDelete.join(' ')}`)
		})
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

		return Effect.gen(this, function* () {
			$(template.replace('%s', script.join(' ')))
		})
	}
}
