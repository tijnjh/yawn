package main

import (
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
)

// execute runs cmdStr in a shell, inheriting stdin/stdout/stderr so interactive
// package-manager output is passed through unchanged.
//
// Robustness improvements over the original TypeScript version:
//   - Signals (SIGINT, SIGTERM) are forwarded to the child so Ctrl+C works
//     correctly for long-running commands like `npm run dev`.
//   - The child's exit code is propagated: if the package manager exits non-zero,
//     yawn does too, which lets CI pipelines detect failures.
func execute(cmdStr string) error {
	if cmdStr == "" {
		return fmt.Errorf("empty command")
	}

	cmd := exec.Command("sh", "-c", cmdStr)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("could not start %q: %w", cmdStr, err)
	}

	// Forward SIGINT / SIGTERM to the child so it can shut down gracefully.
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, os.Interrupt, syscall.SIGTERM)
	go func() {
		for sig := range sigs {
			if cmd.Process != nil {
				_ = cmd.Process.Signal(sig)
			}
		}
	}()

	err := cmd.Wait()
	signal.Stop(sigs)
	close(sigs)

	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			// Mirror the child's exit code rather than printing a generic error.
			os.Exit(exitErr.ExitCode())
		}
		return fmt.Errorf("command %q failed: %w", cmdStr, err)
	}
	return nil
}
