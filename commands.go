package main

import (
	"fmt"
	"sort"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// commandDef describes a yawn command: its canonical name, all accepted aliases,
// a short description for the help output, and the function to execute.
type commandDef struct {
	id          string
	aliases     []string // aliases[0] is the primary/display name
	description string
	fn          func(params string) error
}

// commandDefs is the ordered list of every command yawn exposes.
// The first alias in each entry is the primary name shown in `yawn info`.
// Populated by init() to avoid an initialisation cycle with cmdInfo.
var commandDefs []*commandDef

func init() {
	commandDefs = []*commandDef{
		{
			id:          "info",
			aliases:     []string{"info", "help"},
			description: "Display help",
			fn:          func(_ string) error { return cmdInfo() },
		},
		{
			id:          "install",
			aliases:     []string{"install", "i"},
			description: "Install dependencies",
			fn:          func(params string) error { return cmdInstall(params) },
		},
		{
			id:          "add",
			aliases:     []string{"add", "a"},
			description: "Add a dependency",
			fn:          func(params string) error { return cmdAdd(params) },
		},
		{
			id:          "update",
			aliases:     []string{"update", "upd"},
			description: "Update dependencies",
			fn:          func(params string) error { return cmdUpdate(params) },
		},
		{
			id:          "run",
			aliases:     []string{"run", "r"},
			description: "Run a script",
			fn:          func(params string) error { return cmdRun(params) },
		},
		{
			id:          "remove",
			aliases:     []string{"remove", "rm", "un", "uninstall"},
			description: "Remove dependencies",
			fn:          func(params string) error { return cmdRemove(params) },
		},
		{
			id:          "dlx",
			aliases:     []string{"dlx", "x"},
			description: "Run a package without installing it",
			fn:          func(params string) error { return cmdDlx(params) },
		},
	}
}

// findCommand returns the commandDef whose alias list contains verb, or nil.
func findCommand(verb string) *commandDef {
	for _, cmd := range commandDefs {
		for _, alias := range cmd.aliases {
			if alias == verb {
				return cmd
			}
		}
	}
	return nil
}

// allAliases returns every alias across all commands (used by didYouMean).
func allAliases() []string {
	var out []string
	for _, cmd := range commandDefs {
		out = append(out, cmd.aliases...)
	}
	return out
}

// ── Command implementations ──────────────────────────────────────────────────

func cmdInfo() error {
	bold := lipgloss.NewStyle().Bold(true)
	gray := lipgloss.NewStyle().Foreground(lipgloss.Color("240"))

	var rows []string
	for _, cmd := range commandDefs {
		aliases := strings.Join(cmd.aliases, ", ")
		row := fmt.Sprintf("  %s %s", bold.Render(fmt.Sprintf("%-22s", aliases)), gray.Render(cmd.description))
		rows = append(rows, row)
	}

	header := bold.Render(fmt.Sprintf("😴 yawn (%s)", version))
	content := header + "\n" + strings.Join(rows, "\n")

	box := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		Padding(0, 1)

	fmt.Println(box.Render(content))
	return nil
}

func cmdInstall(params string) error {
	pm, err := detectPackageManager()
	if err != nil {
		return err
	}
	cmd, err := getCommand(pm, "install", strings.TrimSpace(params))
	if err != nil {
		return err
	}
	return execute(cmd)
}

func cmdAdd(params string) error {
	if strings.TrimSpace(params) == "" {
		return fmt.Errorf("add requires at least one package name")
	}
	pm, err := detectPackageManager()
	if err != nil {
		return err
	}
	cmd, err := getCommand(pm, "add", params)
	if err != nil {
		return err
	}
	return execute(cmd)
}

func cmdUpdate(params string) error {
	pm, err := detectPackageManager()
	if err != nil {
		return err
	}
	cmd, err := getCommand(pm, "update", strings.TrimSpace(params))
	if err != nil {
		return err
	}
	return execute(cmd)
}

func cmdRun(scriptArg string) error {
	if len(pkg.Scripts) == 0 {
		return fmt.Errorf("no scripts found in package.json")
	}

	if strings.TrimSpace(scriptArg) == "" {
		// Interactive script selection, sorted for consistency.
		opts := buildScriptOptions()
		selected, err := selectPrompt("Select a script to run:", opts)
		if err != nil {
			return err
		}
		return cmdRun(selected)
	}

	// The first word is the script name; the rest are extra flags passed through.
	scriptName := strings.Fields(scriptArg)[0]

	if _, ok := pkg.Scripts[scriptName]; ok {
		pm, err := detectPackageManager()
		if err != nil {
			return err
		}
		cmd, err := getCommand(pm, "run", scriptArg)
		if err != nil {
			return err
		}
		return execute(cmd)
	}

	// Script not found – offer a suggestion.
	if suggestion := didYouMean(scriptName, sortedScriptNames()); suggestion != "" {
		confirmed, err := confirmPrompt(fmt.Sprintf("Did you mean %q?", suggestion))
		if err != nil {
			return err
		}
		if confirmed {
			return cmdRun(suggestion)
		}
		return nil
	}

	return fmt.Errorf("script %q not found in package.json", scriptName)
}

func cmdRemove(params string) error {
	if strings.TrimSpace(params) != "" {
		pm, err := detectPackageManager()
		if err != nil {
			return err
		}
		cmd, err := getCommand(pm, "remove", params)
		if err != nil {
			return err
		}
		return execute(cmd)
	}

	// Build a combined, sorted list of all deps and devDeps.
	opts := buildDepOptions()
	if len(opts) == 0 {
		fmt.Println("No dependencies found in package.json")
		return nil
	}

	selected, err := multiSelectPrompt("Select dependencies to remove:", opts)
	if err != nil {
		return err
	}
	if len(selected) == 0 {
		fmt.Println("No dependencies selected")
		return nil
	}

	return cmdRemove(strings.Join(selected, " "))
}

func cmdDlx(params string) error {
	if strings.TrimSpace(params) == "" {
		return fmt.Errorf("dlx requires a package name")
	}
	pm, err := detectPackageManager()
	if err != nil {
		return err
	}
	cmd, err := getCommand(pm, "dlx", params)
	if err != nil {
		return err
	}
	return execute(cmd)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func buildScriptOptions() []selectOption {
	names := sortedScriptNames()
	opts := make([]selectOption, len(names))
	for i, name := range names {
		opts[i] = selectOption{Label: name, Value: name, Hint: pkg.Scripts[name]}
	}
	return opts
}

func sortedScriptNames() []string {
	names := make([]string, 0, len(pkg.Scripts))
	for name := range pkg.Scripts {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

func buildDepOptions() []selectOption {
	type dep struct{ name, ver, kind string }
	deps := make([]dep, 0, len(pkg.Dependencies)+len(pkg.DevDependencies))

	for name, ver := range pkg.Dependencies {
		deps = append(deps, dep{name, ver, ""})
	}
	for name, ver := range pkg.DevDependencies {
		deps = append(deps, dep{name, ver, "dev"})
	}
	sort.Slice(deps, func(i, j int) bool { return deps[i].name < deps[j].name })

	opts := make([]selectOption, len(deps))
	for i, d := range deps {
		label := d.name
		if d.kind != "" {
			label += " (" + d.kind + ")"
		}
		opts[i] = selectOption{Label: label, Value: d.name, Hint: d.ver}
	}
	return opts
}
