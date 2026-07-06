import type * as pmd from "package-manager-detector"

export type AgentName = Extract<pmd.AgentName, 'npm' | 'yarn' | 'pnpm' | 'bun' | 'deno'>
    