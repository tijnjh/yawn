import { pmIndex } from './package-managers'
import consola from 'consola'
import { execSync } from 'node:child_process'
import { detect, type AgentName } from 'package-manager-detector'
import type { Replace } from 'type-fest'

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

	consola.success(`Using ${foundPackageManager}`)
	return foundPackageManager
}

export function $(str: string) {
	const output = execSync(str, { stdio: 'inherit' })
	return output?.toString()
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
