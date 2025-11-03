import consola, { consola as consola$1 } from "consola";
import fs from "node:fs/promises";
import { Effect, Schema, pipe } from "effect";
import { FileSystem } from "@effect/platform";
import { execSync } from "child_process";
import chalk from "chalk";
import dedent from "dedent";
import { NodeContext, NodeRuntime } from "@effect/platform-node";

//#region src/package-json.ts
const pkg = await (async () => {
	try {
		const packageJsonPath = `${process.cwd()}/package.json`;
		const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
		return JSON.parse(packageJsonContent);
	} catch (error) {
		consola$1.fail(error);
	}
})();

//#endregion
//#region src/schemas.ts
const PackageManager = Schema.Literal("npm", "yarn", "pnpm", "bun", "deno");

//#endregion
//#region src/utils.ts
const packageManagers = [
	{
		name: "npm",
		lockFiles: ["package-lock.json"]
	},
	{
		name: "yarn",
		lockFiles: ["yarn.lock"]
	},
	{
		name: "pnpm",
		lockFiles: ["pnpm-lock.yaml"]
	},
	{
		name: "bun",
		lockFiles: ["bun.lockb", "bun.lock"]
	},
	{
		name: "deno",
		lockFiles: ["deno.lock"]
	}
];
const detectPackageManager = Effect.gen(function* () {
	const fs$1 = yield* FileSystem.FileSystem;
	consola.start("Detecting package manager...");
	let foundPackageManager = "unknown";
	if (pkg?.packageManager) foundPackageManager = yield* Schema.decodeUnknown(PackageManager)(pkg.packageManager.split("@")[0]);
	const files = yield* fs$1.readDirectory(process.cwd());
	for (const { lockFiles, name } of packageManagers) if (lockFiles.some((lockFile) => files.includes(lockFile))) foundPackageManager = name;
	if (foundPackageManager === "unknown") {
		consola.warn("Couldn't find package manager, using default");
		foundPackageManager = "bun";
	}
	consola.success(`Using package manager: ${foundPackageManager}`);
	return foundPackageManager;
});
function $(str) {
	consola.box(str);
	const d = execSync(str);
	console.log(d.toString());
}

//#endregion
//#region \0@oxc-project+runtime@0.95.0/helpers/decorate.js
function __decorate(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
}

//#endregion
//#region src/yawn.ts
const commands = [];
function command(c) {
	return (_, propertyKey) => {
		commands.push({
			id: propertyKey,
			aliases: [propertyKey, ...c.aliases],
			description: c.description
		});
	};
}
var Yawn = class Yawn {
	constructor(pm, pkg$1) {
		this.pm = pm;
		this.pkg = pkg$1;
	}
	static init = Effect.gen(function* () {
		const packageManager = yield* detectPackageManager;
		if (!packageManager) return yield* Effect.fail(/* @__PURE__ */ new Error("No package manager found"));
		if (!pkg) return yield* Effect.fail(/* @__PURE__ */ new Error("No package.json found"));
		return new Yawn(packageManager, pkg);
	});
	info() {
		return Effect.gen(this, function* () {
			consola.box({
				title: "Yawn",
				message: dedent`
					${commands.map((command$1) => {
					return dedent`
  							${chalk.bold(command$1.id)}
  							${chalk.gray(command$1.aliases.join(", "))}${" ".repeat(Math.max(0, 40 - command$1.aliases.join(", ").length))} ${command$1.description}
         \n

					`;
				}).join("\n")}
				`
			});
		});
	}
	install(deps) {
		return Effect.gen(this, function* () {
			if (deps && deps.length) {
				$(`${this.pm} install ${deps.join(" ")}`);
				return;
			}
			$(`${this.pm} install`);
		});
	}
	run(script) {
		return Effect.gen(this, function* () {
			$(`${this.pm} run ${script[0]}`);
		});
	}
	remove(deps) {
		return Effect.gen(this, function* () {
			if (deps && deps.length) {
				$(`${this.pm} remove ${deps.join(" ")}`);
				return;
			}
			const options = pipe({
				...this.pkg.dependencies,
				...this.pkg.devDependencies
			}, (v) => Object.entries(v).map(([key, val]) => ({
				label: key,
				value: key,
				hint: val
			})));
			const depsToDelete = yield* Effect.tryPromise({
				try: () => consola.prompt("Select dependencies to remove:", {
					type: "multiselect",
					options
				}),
				catch: (error) => {
					consola.error(error);
					return [];
				}
			});
			if (!depsToDelete.length) {
				console.log("No dependencies selected");
				return;
			}
			$(`${this.pm} remove ${depsToDelete.join(" ")}`);
		});
	}
	dlx(script) {
		let template = "npx";
		switch (this.pm) {
			case "bun":
				template = "bun x %s";
				break;
			case "npm":
				template = "npx %s";
				break;
			case "pnpm":
				template = "pnpm dlx %s";
				break;
			case "yarn":
				template = "npx %s";
				break;
			case "deno":
				template = "deno run -A npm:%s";
				break;
		}
		return Effect.gen(this, function* () {
			$(template.replace("%s", script.join(" ")));
		});
	}
};
__decorate([command({
	aliases: ["help"],
	description: "Display info"
})], Yawn.prototype, "info", null);
__decorate([command({
	aliases: [
		"i",
		"a",
		"add"
	],
	description: "Install dependencies"
})], Yawn.prototype, "install", null);
__decorate([command({
	aliases: ["r"],
	description: "Run a script"
})], Yawn.prototype, "run", null);
__decorate([command({
	aliases: [
		"rm",
		"delete",
		"un",
		"uninstall"
	],
	description: "Remove dependencies"
})], Yawn.prototype, "remove", null);
__decorate([command({
	aliases: ["x"],
	description: "Run a script from a package"
})], Yawn.prototype, "dlx", null);

//#endregion
//#region src/main.ts
const args = process.argv.slice(2);
const verb = args[0];
const params = args.slice(1);
const program = Effect.gen(function* () {
	const yawn = yield* Yawn.init;
	if (!verb) {
		yield* yawn.install(params);
		return;
	}
	const command$1 = commands.find((command$2) => command$2.aliases.includes(verb));
	if (!command$1) {
		consola.error(`Unknown command: ${verb}`);
		process.exit(1);
	}
	yield* yawn[command$1.id](params);
});
NodeRuntime.runMain(program.pipe(Effect.provide(NodeContext.layer)));

//#endregion
export {  };