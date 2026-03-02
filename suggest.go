package main

// didYouMean returns the closest candidate to input using Levenshtein distance,
// or an empty string when no candidate is within a reasonable edit distance.
func didYouMean(input string, candidates []string) string {
	if len(input) == 0 || len(candidates) == 0 {
		return ""
	}

	// Allow at most ceil(len/3) edits so short strings aren't over-matched.
	threshold := max(1, len([]rune(input))/3)

	best := ""
	bestDist := threshold + 1

	for _, c := range candidates {
		if d := levenshtein(input, c); d < bestDist {
			bestDist = d
			best = c
		}
	}

	return best
}

// levenshtein computes the edit distance between s and t using a space-
// efficient two-row dynamic-programming approach.
func levenshtein(s, t string) int {
	sr, tr := []rune(s), []rune(t)
	m, n := len(sr), len(tr)

	if m == 0 {
		return n
	}
	if n == 0 {
		return m
	}

	prev := make([]int, n+1)
	curr := make([]int, n+1)

	for j := 0; j <= n; j++ {
		prev[j] = j
	}

	for i := 1; i <= m; i++ {
		curr[0] = i
		for j := 1; j <= n; j++ {
			if sr[i-1] == tr[j-1] {
				curr[j] = prev[j-1]
			} else {
				curr[j] = 1 + min(prev[j], curr[j-1], prev[j-1])
			}
		}
		prev, curr = curr, prev
	}

	return prev[n]
}
