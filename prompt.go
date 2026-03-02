package main

import (
	"errors"
	"fmt"
	"os"

	"github.com/charmbracelet/huh"
)

// selectOption is a display item for select / multiselect prompts.
type selectOption struct {
	Label string // displayed to the user
	Value string // value returned when selected
	Hint  string // optional secondary info shown alongside the label
}

// selectPrompt shows a single-choice prompt and returns the selected value.
// Exits cleanly when the user aborts (Ctrl+C / Escape).
func selectPrompt(title string, opts []selectOption) (string, error) {
	if len(opts) == 0 {
		return "", fmt.Errorf("no options available")
	}

	huhOpts := make([]huh.Option[string], len(opts))
	for i, o := range opts {
		key := o.Label
		if o.Hint != "" {
			key = fmt.Sprintf("%-20s  %s", o.Label, o.Hint)
		}
		huhOpts[i] = huh.NewOption(key, o.Value)
	}

	var result string
	err := huh.NewSelect[string]().
		Title(title).
		Options(huhOpts...).
		Value(&result).
		Run()

	if errors.Is(err, huh.ErrUserAborted) {
		os.Exit(0)
	}
	return result, err
}

// multiSelectPrompt shows a multi-choice prompt and returns all selected values.
// Exits cleanly when the user aborts.
func multiSelectPrompt(title string, opts []selectOption) ([]string, error) {
	if len(opts) == 0 {
		return nil, fmt.Errorf("no options available")
	}

	huhOpts := make([]huh.Option[string], len(opts))
	for i, o := range opts {
		key := o.Label
		if o.Hint != "" {
			key = fmt.Sprintf("%-20s  %s", o.Label, o.Hint)
		}
		huhOpts[i] = huh.NewOption(key, o.Value)
	}

	var results []string
	err := huh.NewMultiSelect[string]().
		Title(title).
		Options(huhOpts...).
		Value(&results).
		Run()

	if errors.Is(err, huh.ErrUserAborted) {
		os.Exit(0)
	}
	return results, err
}

// confirmPrompt shows a yes/no prompt. Abort (Escape) is treated as "no".
func confirmPrompt(title string) (bool, error) {
	var result bool
	err := huh.NewConfirm().
		Title(title).
		Value(&result).
		Run()

	if errors.Is(err, huh.ErrUserAborted) {
		return false, nil
	}
	return result, err
}

// selectPackageManager prompts the user to pick a package manager interactively.
func selectPackageManager() (string, error) {
	opts := make([]selectOption, len(pmOrder))
	for i, pm := range pmOrder {
		opts[i] = selectOption{Label: pm, Value: pm}
	}
	return selectPrompt("Couldn't detect a package manager, please select one:", opts)
}
