import { pmIndex } from './package-managers'
import consola from 'consola'
import { execSync } from 'node:child_process'
import { detect, type AgentName } from 'package-manager-detector'
import type { Replace } from 'type-fest'

declare const YAWN_VERSION: string

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

let foundPackageManager: AgentName | null = null

export async function detectPackageManager() {
	if (foundPackageManager !== null) {
		return foundPackageManager
	}

	const detectionResult = await detect()

	if (detectionResult) {
		foundPackageManager = detectionResult.name
	}

	if (foundPackageManager === null) {
		const keys = Object.keys(pmIndex) as AgentName[]

		foundPackageManager = await consola.prompt(
			"Couldn't find package manager, please select one",
			{
				type: 'select',
				options: keys.map((name) => ({
					value: name,
					label: name,
				})),
			},
		)
	}
	console.log(`😴 yawn (${YAWN_VERSION})`)
	consola.success(`Using ${foundPackageManager}`)
	return foundPackageManager
}

export function $(str: string) {
	const output = execSync(str, { stdio: 'inherit' })
	return output?.toString()
}

export type ClassMethods<T> = {
	[K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K]
}

export function typedReplace<
	Input extends string,
	Search extends string,
	Replacement extends string,
>(input: Input, search: Search, replacement: Replacement) {
	return input.replace(search, replacement) as Replace<
		Input,
		Search,
		Replacement
	>
}
