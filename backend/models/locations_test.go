package models

import "testing"

func TestFormatLocationName(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "capitalizes each word",
			input: "south park",
			want:  "South Park",
		},
		{
			name:  "normalizes extra spaces",
			input: "  east   side  ",
			want:  "East Side",
		},
		{
			name:  "does not capitalize number-leading words",
			input: "2ND avenue",
			want:  "2nd Avenue",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := formatLocationName(test.input); got != test.want {
				t.Fatalf("formatLocationName(%q) = %q, want %q", test.input, got, test.want)
			}
		})
	}
}
