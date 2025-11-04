import { typedReplace } from './utils'
import type { YawnMethods } from './yawn'
import * as v from 'valibot'

export const PackageManager = v.picklist(['npm', 'yarn', 'pnpm', 'bun', 'deno'])

export type PackageManager = v.InferOutput<typeof PackageManager>

type CommandMethods = Exclude<YawnMethods, 'info'>

type PmIndex = Record<
	PackageManager,
	{
		lockFiles: string[]
		commands: Record<CommandMethods, string>
	}
>

export const pmIndex = {
	npm: {
		lockFiles: ['package-lock.json'],
		commands: {
			install: 'npm install {}',
			update: 'npm update {}',
			run: 'npm run {}',
			remove: 'npm uninstall {}',
			dlx: 'npx {}',
		},
	},
	yarn: {
		lockFiles: ['yarn.lock'],
		commands: {
			install: 'yarn install {}',
			update: 'yarn upgrade {}',
			run: 'yarn run {}',
			remove: 'yarn remove {}',
			dlx: 'npx {}', // lol
		},
	},
	pnpm: {
		lockFiles: ['pnpm-lock.yaml'],
		commands: {
			install: 'pnpm install {}',
			update: 'pnpm update {}',
			run: 'pnpm {}',
			remove: 'pnpm remove {}',
			dlx: 'pnpm dlx {}',
		},
	},
	bun: {
		lockFiles: ['bun.lockb', 'bun.lock'],
		commands: {
			install: 'bun i {}',
			update: 'bun update {}',
			run: 'bun run {}',
			remove: 'bun remove {}',
			dlx: 'bun x {}',
		},
	},
	deno: {
		lockFiles: ['deno.lock'],
		commands: {
			install: 'deno install npm:{}',
			update: 'deno update {}',
			run: 'deno run {}',
			remove: 'deno uninstall {}',
			dlx: 'deno run -A npm:{}',
		},
	},
} as const satisfies PmIndex

export function getCommand<
	P extends PackageManager,
	M extends CommandMethods,
	A extends string,
>(packageManager: P, method: M, args?: A) {
	let out = pmIndex[packageManager]['commands'][method]

	if (!out) {
		throw new Error(`Unsupported package manager: ${packageManager}`)
	}

	return typedReplace(out, '{}', args ?? '')
}
