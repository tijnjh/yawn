package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// version is injected at build time via -ldflags; falls back to dev.
var version = "dev"

func main() {
	args := os.Args[1:]

	var verb, params string
	if len(args) > 0 {
		verb = args[0]
	}
	if len(args) > 1 {
		params = strings.Join(args[1:], " ")
	}

	if err := dispatch(verb, params); err != nil {
		fmt.Fprintf(os.Stderr, "%s %v\n", errPrefix.Render("✗"), err)
		os.Exit(1)
	}
}

func dispatch(verb, params string) error {
	// No command → install
	if verb == "" {
		return cmdInstall(params)
	}

	// Known command
	if cmd := findCommand(verb); cmd != nil {
		return cmd.fn(params)
	}

	// Unknown command – offer a suggestion
	if suggestion := didYouMean(verb, allAliases()); suggestion != "" {
		confirmed, err := confirmPrompt(fmt.Sprintf("Did you mean %q?", suggestion))
		if err != nil {
			return err
		}
		if confirmed {
			if cmd := findCommand(suggestion); cmd != nil {
				return cmd.fn(params)
			}
		}
	}

	// Fall back to running it as a script name, preserving any extra flags.
	scriptArg := verb
	if params != "" {
		scriptArg = verb + " " + params
	}
	return cmdRun(scriptArg)
}

var (
	errPrefix = lipgloss.NewStyle().Foreground(lipgloss.Color("1"))
	okPrefix  = lipgloss.NewStyle().Foreground(lipgloss.Color("2"))
)

func printSuccess(msg string) {
	fmt.Fprintf(os.Stderr, "%s %s\n", okPrefix.Render("✓"), msg)
}
