package models

import "testing"

func TestFormatWorkerText(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "capitalizes each word",
			input: "mary jane",
			want:  "Mary Jane",
		},
		{
			name:  "normalizes extra spaces",
			input: "  main   street  ",
			want:  "Main Street",
		},
		{
			name:  "does not capitalize number-leading words",
			input: "2ND avenue",
			want:  "2nd Avenue",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := formatWorkerText(test.input); got != test.want {
				t.Fatalf("formatWorkerText(%q) = %q, want %q", test.input, got, test.want)
			}
		})
	}
}
