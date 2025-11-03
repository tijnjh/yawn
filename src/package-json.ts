import { consola } from 'consola'
import fs from 'node:fs'
import type { PackageJson } from 'type-fest'

export const pkg = (() => {
	try {
		const packageJsonPath = `${process.cwd()}/package.json`
		const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8')
		const packageJson = JSON.parse(packageJsonContent)
		return packageJson as PackageJson
	} catch (error) {
		consola.fail(error)
	}
})()
