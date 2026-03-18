import type { Replace } from 'type-fest'

declare global {
	interface String {
		replace<
			This extends string,
			Search extends string,
			Replacement extends string,
		>(
			this: This,
			search: Search,
			replacement: Replacement,
		): Replace<This, Search, Replacement>
	}
}
