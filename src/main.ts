import { commands, Yawn } from './yawn'

async function main() {
	const args = process.argv.slice(2)

	const verb = args[0]
	const params = args.slice(1)

	const yawn = new Yawn()

	if (!verb) {
		yawn.install(params)
		return
	}

	const command = commands.find((command) => command.aliases.includes(verb))

	if (!command) {
		await yawn.run([verb])
		return
	}

	await yawn[command.id](params)
}

main()
