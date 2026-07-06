import { pmIndex } from './package-managers.ts'
import consola from 'consola'
import { execSync } from 'node:child_process'
import { detect } from 'package-manager-detector'
import type { AgentName } from './types.ts'

let foundPackageManager: AgentName | null = null

export async function detectPackageManager() {
	if (foundPackageManager !== null) {
		return foundPackageManager
	}

	const detectionResult = await detect()

	if (detectionResult) {
		foundPackageManager = detectionResult.name as AgentName
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

export function execute(str: string) {
	const output = execSync(str, { stdio: 'inherit' })
	return output?.toString()
}
