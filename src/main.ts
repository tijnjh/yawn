import { commands, Yawn } from './yawn'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import consola from 'consola'
import { Effect } from 'effect'

const args = process.argv.slice(2)

const verb = args[0]
const params = args.slice(1)

const program = Effect.gen(function* () {
	const yawn = yield* Yawn.init

	if (!verb) {
		yield* yawn.install(params)
		return
	}

	const command = commands.find((command) => command.aliases.includes(verb))

	if (!command) {
		consola.error(`Unknown command: ${verb}`)
		process.exit(1)
	}

	yield* yawn[command.id](params)
})

NodeRuntime.runMain(program.pipe(Effect.provide(NodeContext.layer)))
