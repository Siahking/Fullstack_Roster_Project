package models

import "testing"

func TestFormatConstraintNote(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "capitalizes first character only",
			input: "cannot work together",
			want:  "Cannot work together",
		},
		{
			name:  "trims surrounding spaces",
			input: "  already Has mixed Case  ",
			want:  "Already Has mixed Case",
		},
		{
			name:  "keeps empty notes empty",
			input: "   ",
			want:  "",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := formatConstraintNote(test.input); got != test.want {
				t.Fatalf("formatConstraintNote(%q) = %q, want %q", test.input, got, test.want)
			}
		})
	}
}
