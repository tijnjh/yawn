package main

import (
	"fmt"
	"os"
	"strings"
	"sync"
)

// pmEntry holds the lock-file names and command templates for one package manager.
// "{}" in a template is replaced with the user-supplied argument.
type pmEntry struct {
	lockFiles []string
	commands  map[string]string
}

// pmIndex maps every supported package manager to its metadata.
var pmIndex = map[string]pmEntry{
	"npm": {
		lockFiles: []string{"package-lock.json"},
		commands: map[string]string{
			"install": "npm install {}",
			"add":     "npm i {}",
			"update":  "npm update {}",
			"run":     "npm run {}",
			"remove":  "npm uninstall {}",
			"dlx":     "npx {}",
		},
	},
	"yarn": {
		lockFiles: []string{"yarn.lock"},
		commands: map[string]string{
			"install": "yarn install {}",
			"add":     "yarn add {}",
			"update":  "yarn upgrade {}",
			"run":     "yarn run {}",
			"remove":  "yarn remove {}",
			"dlx":     "npx {}",
		},
	},
	"pnpm": {
		lockFiles: []string{"pnpm-lock.yaml"},
		commands: map[string]string{
			"install": "pnpm install {}",
			"add":     "pnpm add {}",
			"update":  "pnpm update {}",
			"run":     "pnpm {}",
			"remove":  "pnpm remove {}",
			"dlx":     "pnpm dlx {}",
		},
	},
	"bun": {
		lockFiles: []string{"bun.lockb", "bun.lock"},
		commands: map[string]string{
			"install": "bun i {}",
			"add":     "bun add {}",
			"update":  "bun update {}",
			"run":     "bun run {}",
			"remove":  "bun remove {}",
			"dlx":     "bun x {}",
		},
	},
	"deno": {
		lockFiles: []string{"deno.lock"},
		commands: map[string]string{
			"install": "deno install",
			"add":     "deno add npm:{}",
			"update":  "deno update {}",
			"run":     "deno run {}",
			"remove":  "deno uninstall {}",
			"dlx":     "deno run -A npm:{}",
		},
	},
}

// pmOrder sets the priority in which lock files are checked.
// More specific/modern tools are preferred when multiple lock files exist.
var pmOrder = []string{"bun", "pnpm", "yarn", "deno", "npm"}

var (
	detectedPM  string
	detectErr   error
	detectOnce  sync.Once
)

// detectPackageManager returns the package manager for the current project,
// detecting it at most once and caching the result.
//
// Detection order (highest priority first):
//  1. "packageManager" field in package.json
//  2. Presence of a known lock file
//  3. Interactive prompt
func detectPackageManager() (string, error) {
	detectOnce.Do(func() {
		detectedPM, detectErr = doDetect()
		if detectErr == nil {
			fmt.Fprintf(os.Stderr, "😴 yawn (%s)\n", version)
			printSuccess("Using " + detectedPM)
		}
	})
	return detectedPM, detectErr
}

func doDetect() (string, error) {
	// 1. "packageManager" field in package.json (e.g. "pnpm@9.0.0")
	if pkg.PackageManager != "" {
		name := strings.SplitN(pkg.PackageManager, "@", 2)[0]
		if _, ok := pmIndex[name]; ok {
			return name, nil
		}
		// Unrecognised value – fall through to lock-file detection.
	}

	// 2. Lock-file detection in the directory that contains package.json
	//    (or cwd when no package.json was found).
	dir := pkgDir
	if dir == "" {
		var err error
		dir, err = os.Getwd()
		if err != nil {
			return "", fmt.Errorf("getting working directory: %w", err)
		}
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", fmt.Errorf("reading directory %q: %w", dir, err)
	}

	fileSet := make(map[string]struct{}, len(entries))
	for _, e := range entries {
		fileSet[e.Name()] = struct{}{}
	}

	for _, pm := range pmOrder {
		for _, lf := range pmIndex[pm].lockFiles {
			if _, exists := fileSet[lf]; exists {
				return pm, nil
			}
		}
	}

	// 3. Ask the user interactively.
	return selectPackageManager()
}

// getCommand builds the shell command string for the given operation.
func getCommand(pm, method, args string) (string, error) {
	entry, ok := pmIndex[pm]
	if !ok {
		return "", fmt.Errorf("unsupported package manager: %s", pm)
	}
	tmpl, ok := entry.commands[method]
	if !ok {
		return "", fmt.Errorf("package manager %s has no %q command", pm, method)
	}
	return strings.Replace(tmpl, "{}", args, 1), nil
}
