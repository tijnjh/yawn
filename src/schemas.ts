import * as v from 'valibot'

export const PackageManager = v.picklist(['npm', 'yarn', 'pnpm', 'bun', 'deno'])

export type PackageManager = v.InferOutput<typeof PackageManager>
