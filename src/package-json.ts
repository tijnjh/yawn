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
