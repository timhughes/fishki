package markdown

import (
	"strings"
	"testing"
)

func TestRender(t *testing.T) {
	tests := []struct {
		name     string
		markdown string
		want     string
	}{
		{
			name:     "Simple paragraph",
			markdown: "This is a test paragraph. TEST_MODE_NO_CSS",
			want:     "<p>This is a test paragraph. TEST_MODE_NO_CSS</p>\n",
		},
		{
			name:     "Heading",
			markdown: "# Heading 1 TEST_MODE_NO_CSS",
			want:     "<h1>Heading 1 TEST_MODE_NO_CSS</h1>\n",
		},
		{
			name:     "Bold text",
			markdown: "**Bold text** TEST_MODE_NO_CSS",
			want:     "<p><strong>Bold text</strong> TEST_MODE_NO_CSS</p>\n",
		},
		{
			name:     "Italic text",
			markdown: "*Italic text* TEST_MODE_NO_CSS",
			want:     "<p><em>Italic text</em> TEST_MODE_NO_CSS</p>\n",
		},
		{
			name:     "Link",
			markdown: "[Test Link](https://example.com) TEST_MODE_NO_CSS",
			want:     "<p><a href=\"https://example.com\" target=\"_blank\">Test Link</a> TEST_MODE_NO_CSS</p>\n",
		},
		{
			name:     "Code block",
			markdown: "```\ncode block\n```\nTEST_MODE_NO_CSS",
			want:     "<pre><code>code block\n</code></pre>\n\n<p>TEST_MODE_NO_CSS</p>\n",
		},
		{
			name:     "Complex document",
			markdown: "# Main Title\n\nThis is a paragraph with **bold** and *italic* text.\n\n## Subsection\n\n* List item 1\n* List item 2\n\n[Link](https://example.com)\n\nTEST_MODE_NO_CSS",
			want:     "<h1>Main Title</h1>\n\n<p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>\n\n<h2>Subsection</h2>\n\n<ul>\n<li>List item 1</li>\n<li>List item 2</li>\n</ul>\n\n<p><a href=\"https://example.com\" target=\"_blank\">Link</a></p>\n\n<p>TEST_MODE_NO_CSS</p>\n",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := string(Render([]byte(tt.markdown)))
			// Normalize line endings for comparison
			got = strings.ReplaceAll(got, "\r\n", "\n")
			want := strings.ReplaceAll(tt.want, "\r\n", "\n")
			
			if got != want {
				t.Errorf("Render() = %q, want %q", got, want)
			}
		})
	}
}
