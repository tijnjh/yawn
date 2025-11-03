import { pkg } from './package-json'
import { PackageManager } from './schemas'
import consola from 'consola'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import * as v from 'valibot'

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

export function detectPackageManager() {
	let foundPackageManager: PackageManager | 'unknown' = 'unknown'

	if (pkg?.packageManager) {
		foundPackageManager = v.parse(
			PackageManager,
			pkg.packageManager.split('@')[0],
		)
	}

	const files = fs.readdirSync(process.cwd())

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
}

export function $(str: string) {
	execSync(str)
}

export type ClassMethods<T> = {
	[K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K]
}
