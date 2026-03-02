# Publishing yawn to npm

yawn uses [golang-npm](https://www.npmjs.com/package/golang-npm) + [GoReleaser](https://goreleaser.com/) to distribute precompiled Go binaries via npm.

## How it works

1. **GoReleaser** cross-compiles binaries and uploads them to GitHub Releases
2. **golang-npm** runs as a postinstall hook — when a user runs `npm i -g yawnpm`, it detects their OS/arch and downloads the right binary from GitHub Releases

## Release workflow

### Prerequisites

```bash
# Install GoReleaser
brew install goreleaser    # macOS
# or: go install github.com/goreleaser/goreleaser/v2@latest

# Make sure you have a GitHub token with repo access
export GITHUB_TOKEN="your-token"

# Make sure you're logged in to npm
npm login
```

### 1. Tag a new version

```bash
# Update the version in package.json to match
# Then tag:
git tag v0.4.0
git push origin v0.4.0
```

### 2. Run GoReleaser

```bash
goreleaser release --clean
```

This compiles binaries for all platforms (darwin/linux/windows, amd64/arm64) and creates a GitHub Release with the archives.

### 3. Publish to npm

```bash
npm publish
```

Users can now install with:

```bash
npm i -g yawnpm
```

## Automating with GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags: ["v*"]

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: "https://registry.npmjs.org"
      - uses: goreleaser/goreleaser-action@v6
        with:
          version: "~> v2"
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add your `NPM_TOKEN` as a repository secret in GitHub settings.

Then releasing is just:

```bash
# bump version in package.json, commit, tag, push
git tag v0.5.0
git push origin v0.5.0
```

GitHub Actions handles the rest.
