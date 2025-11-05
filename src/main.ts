import { commands, Yawn } from './yawn'
import consola from 'consola'
import dym from 'didyoumean'

function findCommand(verb: string) {
	return commands.find((command) => command.aliases.includes(verb))
}

async function main() {
	// given the input is `yawn run dev --host`

	const args = process.argv.slice(2) // ['run', 'dev', '--host']
	const verb = args[0] // 'run'
	const params = args.slice(1).join(' ') // 'dev --host'

	const yawn = new Yawn()

	if (!verb) {
		yawn.install(params)
		return
	}

	const foundCommand = findCommand(verb)

	if (!foundCommand) {
		const suggestion = dym(verb, commands.map((c) => c.aliases).flat())

		if (suggestion) {
			const confirm = await consola.prompt(`Did you mean ${suggestion}?`, {
				type: 'confirm',
			})

			const foundCommand = findCommand(suggestion)

			if (confirm && foundCommand) {
				yawn[foundCommand.id](params)
				return
			}
		}

		await yawn.run(verb)
		return
	}

	await yawn[foundCommand.id](params)
}

main()
