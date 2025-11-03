import { Schema } from 'effect'

export const PackageManager = Schema.Literal(
	'npm',
	'yarn',
	'pnpm',
	'bun',
	'deno',
)

export type PackageManager = typeof PackageManager.Type
