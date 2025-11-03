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
