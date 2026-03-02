package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// PackageJSON holds the fields from package.json that yawn cares about.
type PackageJSON struct {
	PackageManager  string            `json:"packageManager"`
	Scripts         map[string]string `json:"scripts"`
	Dependencies    map[string]string `json:"dependencies"`
	DevDependencies map[string]string `json:"devDependencies"`
}

// pkg is the parsed package.json, and pkgDir is the directory it was found in.
// Both are populated once at startup by walking up from cwd.
var (
	pkg    *PackageJSON
	pkgDir string
)

func init() {
	pkg, pkgDir = findPackageJSON()
}

// findPackageJSON walks up from the current working directory until it finds
// a parseable package.json, mimicking the resolution strategy used by npm.
func findPackageJSON() (*PackageJSON, string) {
	dir, err := os.Getwd()
	if err != nil {
		return &PackageJSON{}, ""
	}

	for {
		data, err := os.ReadFile(filepath.Join(dir, "package.json"))
		if err == nil {
			var p PackageJSON
			if json.Unmarshal(data, &p) == nil {
				return &p, dir
			}
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break // reached the filesystem root
		}
		dir = parent
	}

	return &PackageJSON{}, ""
}
