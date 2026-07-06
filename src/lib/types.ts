import { main } from '../index.ts'
import type * as pmd from 'package-manager-detector'

export type AgentName = Extract<
	pmd.AgentName,
	'npm' | 'yarn' | 'pnpm' | 'bun' | 'deno'
>

export type SubCommandName = Exclude<keyof typeof main.subCommands, '_'>
