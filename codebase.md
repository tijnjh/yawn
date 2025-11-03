# .gitignore

```
/dist
/node_modules

```

# .prettierrc

```
{
	"plugins": ["@trivago/prettier-plugin-sort-imports"],
	"importOrderParserPlugins": ["typescript", "decorators"],
	"useTabs": true,
	"semi": false,
	"singleQuote": true
}

```

# package.json

```json
{
	"name": "yawnpm",
	"version": "0.1.3",
	"type": "module",
	"module": "src/main.ts",
	"scripts": {
		"build": "tsdown"
	},
	"bin": {
		"yawn": "./dist/main.js"
	},
	"dependencies": {
		"@effect/platform": "^0.92.1",
		"@effect/platform-node": "^0.98.4",
		"@types/node": "^24.10.0",
		"chalk": "^5.6.2",
		"consola": "^3.4.2",
		"dedent": "^1.7.0",
		"effect": "^3.18.4"
	},
	"devDependencies": {
		"@trivago/prettier-plugin-sort-imports": "^5.2.2",
		"install": "^0.13.0",
		"prettier": "^3.6.2",
		"tsdown": "^0.15.12",
		"type-fest": "^5.2.0"
	}
}

```

# src/main.ts

```ts
import { commands, Yawn } from './yawn'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import consola from 'consola'
import { Effect } from 'effect'

const args = process.argv.slice(2)

const verb = args[0]
const params = args.slice(1)

const program = Effect.gen(function* () {
	const yawn = yield* Yawn.init

	if (!verb) {
		yield* yawn.install(params)
		return
	}

	const command = commands.find((command) => command.aliases.includes(verb))

	if (!command) {
		consola.error(`Unknown command: ${verb}`)
		process.exit(1)
	}

	yield* yawn[command.id](params)
})

NodeRuntime.runMain(program.pipe(Effect.provide(NodeContext.layer)))

```

# src/mappings.ts

```ts
// import type { PackageManager } from './schemas'
// import type { YawnMethods } from './yawn'

// export const pmMappings: Record<YawnMethods, Record<PackageManager, string>> = {
// 	dlx: {
// 		bun: 'bun',
// 		npm: 'npm',
// 		yarn: 'yarn',
// 		pnpm: 'pnpm',
// 		deno: 'deno',
// 	},
// }

// @todo

```

# src/package-json.ts

```ts
import { consola } from 'consola'
import fs from 'node:fs/promises'
import type { PackageJson } from 'type-fest'

export const pkg = await (async () => {
	try {
		const packageJsonPath = `${process.cwd()}/package.json`
		const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
		const packageJson = JSON.parse(packageJsonContent)
		return packageJson as PackageJson
	} catch (error) {
		consola.fail(error)
	}
})()

```

# src/schemas.ts

```ts
import { Schema } from 'effect'

export const PackageManager = Schema.Literal(
	'npm',
	'yarn',
	'pnpm',
	'bun',
	'deno',
)

export type PackageManager = typeof PackageManager.Type

```

# src/utils.ts

```ts
import { pkg } from './package-json'
import { PackageManager } from './schemas'
import { FileSystem } from '@effect/platform'
import consola from 'consola'
import { Effect, Schema } from 'effect'
import { execSync } from 'node:child_process'

const packageManagers = [
	{
		name: 'npm',
		lockFiles: ['package-lock.json'],
	},
	{
		name: 'yarn',
		lockFiles: ['yarn.lock'],
	},
	{
		name: 'pnpm',
		lockFiles: ['pnpm-lock.yaml'],
	},
	{
		name: 'bun',
		lockFiles: ['bun.lockb', 'bun.lock'],
	},
	{
		name: 'deno',
		lockFiles: ['deno.lock'],
	},
] as const

export function normalizeError(error: unknown): Error {
	if (error instanceof Error) {
		return error
	}

	if (typeof error === 'object') {
		return new Error(JSON.stringify(error))
	}

	if (typeof error === 'string') {
		return new Error(error)
	}

	return new Error(String(error))
}

export const detectPackageManager = Effect.gen(function* () {
	const fs = yield* FileSystem.FileSystem

	consola.start('Detecting package manager...')

	let foundPackageManager: PackageManager | 'unknown' = 'unknown'

	if (pkg?.packageManager) {
		foundPackageManager = yield* Schema.decodeUnknown(PackageManager)(
			pkg.packageManager.split('@')[0],
		)
	}

	const files = yield* fs.readDirectory(process.cwd())

	for (const { lockFiles, name } of packageManagers) {
		if (lockFiles.some((lockFile: string) => files.includes(lockFile))) {
			foundPackageManager = name
		}
	}

	if (foundPackageManager === 'unknown') {
		consola.warn("Couldn't find package manager, using default")
		foundPackageManager = 'bun'
	}

	consola.success(`Using package manager: ${foundPackageManager}`)
	return foundPackageManager
})

export function $(str: string) {
	consola.box(str)

	const d = execSync(str)

	console.log(d.toString())
}

export type ClassMethods<T> = {
	[K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K]
}

```

# src/yawn.ts

```ts
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

```

# tsconfig.json

```json
{
	"compilerOptions": {
		"esModuleInterop": true,
		"skipLibCheck": true,
		"target": "es2022",
		"allowJs": true,
		"resolveJsonModule": true,
		"moduleDetection": "force",
		"isolatedModules": true,
		"verbatimModuleSyntax": true,
		"strict": true,
		"noUncheckedIndexedAccess": true,
		"noImplicitOverride": true,
		"experimentalDecorators": true,
		"module": "preserve",
		"noEmit": true,
		"lib": ["es2022"]
	},
	"include": ["**/*.ts", "**/*.tsx"],
	"exclude": ["node_modules"]
}

```

# tsdown.config.ts

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: ['./src/main.ts'],
	platform: 'node',
	noExternal: [
		'@effect/platform',
		'@effect/platform-node',
		'@types/node',
		'chalk',
		'consola',
		'dedent',
		'effect',
	],
})

```

