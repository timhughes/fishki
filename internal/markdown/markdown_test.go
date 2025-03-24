package markdown

import (
	"bytes"
	"strings"
	"testing"
	"time"
)

func TestRender(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Basic heading",
			input:    "# Test Heading",
			expected: "<h1>Test Heading</h1>",
		},
		{
			name:     "Paragraph",
			input:    "This is a test paragraph.",
			expected: "<p>This is a test paragraph.</p>",
		},
		{
			name:     "Bold text",
			input:    "This is **bold** text",
			expected: "<p>This is <strong>bold</strong> text</p>",
		},
		{
			name:     "Italic text",
			input:    "This is *italic* text",
			expected: "<p>This is <em>italic</em> text</p>",
		},
		{
			name:     "Link",
			input:    "[Test Link](https://example.com)",
			expected: `<p><a href="https://example.com">Test Link</a></p>`,
		},
		{
			name:     "Code block",
			input:    "```\ncode block\n```",
			expected: "<pre><code>code block\n</code></pre>",
		},
		{
			name:     "Empty input",
			input:    "",
			expected: "",
		},
		{
			name: "Complex document",
			input: `# Main Title

This is a paragraph with **bold** and *italic* text.

## Subsection

- List item 1
- List item 2

[Link](https://example.com)`,
			expected: strings.Join([]string{
				"<h1>Main Title</h1>",
				"<p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>",
				"<h2>Subsection</h2>",
				"<ul>",
				"<li>List item 1</li>",
				"<li>List item 2</li>",
				"</ul>",
				`<p><a href="https://example.com">Link</a></p>`,
			}, "\n"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := string(Render([]byte(tt.input)))
			got = strings.TrimSpace(got)
			want := strings.TrimSpace(tt.expected)

			// Normalize line endings for comparison
			gotNorm := strings.ReplaceAll(got, "\n\n", "\n")
			wantNorm := strings.ReplaceAll(want, "\n\n", "\n")
			if gotNorm != wantNorm {
				t.Errorf("Render() = %q, want %q", got, want)
			}
		})
	}
}

func TestRenderSpecialCharacters(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "HTML entities",
			input:    "This & that < >",
			expected: "<p>This &amp; that &lt; &gt;</p>",
		},
		{
			name:     "Unicode characters",
			input:    "Hello 世界",
			expected: "<p>Hello 世界</p>",
		},
		{
			name:     "Code with special chars",
			input:    "```\n<div>&amp;</div>\n```",
			expected: "<pre><code>&lt;div&gt;&amp;amp;&lt;/div&gt;\n</code></pre>",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := string(Render([]byte(tt.input)))
			got = strings.TrimSpace(got)
			want := strings.TrimSpace(tt.expected)

			if got != want {
				t.Errorf("Render() = %q, want %q", got, want)
			}
		})
	}
}

func TestRenderPerformance(t *testing.T) {
	// Create a large markdown document
	var buf bytes.Buffer
	for i := 0; i < 1000; i++ {
		buf.WriteString("# Heading\n\nParagraph with **bold** and *italic* text.\n\n")
	}

	// Test rendering performance
	start := time.Now()
	Render(buf.Bytes())
	duration := time.Since(start)

	// This is a rough benchmark - adjust the threshold based on the system
	if duration > time.Second*2 {
		t.Errorf("Render took too long: %v", duration)
	}
}
