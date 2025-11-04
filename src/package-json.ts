import { consola } from 'consola'
import { safeDestr } from 'destr'
import fs from 'node:fs'
import type { PackageJson } from 'type-fest'

function getPkg() {
	try {
		const raw = fs.readFileSync(`${process.cwd()}/package.json`, 'utf-8')
		const parsed = safeDestr<PackageJson>(raw)
		return parsed
	} catch (error) {
		consola.fail(error)
	}
	return {}
}

export const pkg = getPkg()
