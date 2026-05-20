import type { main } from '..'
import type { AgentName } from 'package-manager-detector'

type SubCommands = keyof typeof main.subCommands

type PmIndex = Record<
	AgentName,
	{
		lockFiles: string[]
		commands: Record<SubCommands, string>
	}
>

export const pmIndex = {
	npm: {
		lockFiles: ['package-lock.json'],
		commands: {
			install: 'npm install {}',
			add: 'npm i {}',
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
			add: 'yarn add {}',
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
			add: 'pnpm add {}',
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
			add: 'bun add {}',
			update: 'bun update {}',
			run: 'bun run {}',
			remove: 'bun remove {}',
			dlx: 'bun x {}',
		},
	},
	deno: {
		lockFiles: ['deno.lock'],
		commands: {
			install: 'deno install',
			add: 'deno add npm:{}',
			update: 'deno update {}',
			run: 'deno run {}',
			remove: 'deno uninstall {}',
			dlx: 'deno run -A npm:{}',
		},
	},
} as const satisfies PmIndex

export function getCommand<
	P extends AgentName,
	M extends SubCommands,
	A extends string,
>(packageManager: P, method: M, args?: A) {
	const out = pmIndex[packageManager]?.commands?.[method]

	if (!out) {
		throw new Error(`Unsupported package manager: ${packageManager}`)
	}

	return out.replace('{}', args ?? '')
}
