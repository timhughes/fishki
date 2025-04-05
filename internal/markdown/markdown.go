package markdown

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/alecthomas/chroma/formatters/html"
	"github.com/alecthomas/chroma/lexers"
	"github.com/alecthomas/chroma/styles"
	"github.com/russross/blackfriday/v2"
)

// Custom renderer that extends the default HTML renderer
type syntaxHighlightRenderer struct {
	*blackfriday.HTMLRenderer
}

// Override the CodeBlock method to add syntax highlighting
func (r *syntaxHighlightRenderer) CodeBlock(out *bytes.Buffer, text []byte, info string, _ bool) {
	// Get the language from the info string
	lang := strings.TrimSpace(string(info))
	
	// If no language is specified, try to guess or use plaintext
	if lang == "" {
		lang = "plaintext"
	}

	// Get the lexer for the language
	lexer := lexers.Get(lang)
	if lexer == nil {
		lexer = lexers.Fallback
	}
	
	// Use the GitHub style for syntax highlighting
	style := styles.Get("github")
	if style == nil {
		style = styles.Fallback
	}
	
	formatter := html.New(html.WithClasses(true))
	
	// Parse the code with the lexer
	iterator, err := lexer.Tokenise(nil, string(text))
	if err != nil {
		// If there's an error, fall back to the default renderer
		out.WriteString("<pre><code>")
		out.Write(text)
		out.WriteString("</code></pre>\n")
		return
	}
	
	// Write the CSS classes for the code block
	out.WriteString(fmt.Sprintf("<pre class=\"chroma\"><code class=\"language-%s\">", lang))
	
	// Format the code with the formatter
	err = formatter.Format(out, style, iterator)
	if err != nil {
		// If there's an error, fall back to the default renderer
		out.WriteString("<pre><code>")
		out.Write(text)
		out.WriteString("</code></pre>\n")
		return
	}
	
	out.WriteString("</code></pre>\n")
}

// Render converts markdown to HTML with syntax highlighting
func Render(markdown []byte) []byte {
	// Create a custom renderer with syntax highlighting
	renderer := &syntaxHighlightRenderer{
		HTMLRenderer: blackfriday.NewHTMLRenderer(blackfriday.HTMLRendererParameters{
			Flags: blackfriday.CommonHTMLFlags,
		}),
	}
	
	// Generate HTML with the custom renderer
	html := blackfriday.Run(markdown, blackfriday.WithRenderer(renderer))
	
	// Add CSS for syntax highlighting
	css := generateSyntaxHighlightingCSS()
	
	// Combine the CSS and HTML
	return append([]byte(css), html...)
}

// generateSyntaxHighlightingCSS generates the CSS for syntax highlighting
func generateSyntaxHighlightingCSS() string {
	// Use the GitHub style for syntax highlighting
	style := styles.Get("github")
	if style == nil {
		style = styles.Fallback
	}
	
	// Format the CSS
	var buf bytes.Buffer
	formatter := html.New(html.WithClasses(true))
	err := formatter.WriteCSS(&buf, style)
	if err != nil {
		return ""
	}
	
	// Wrap the CSS in a style tag
	return fmt.Sprintf("<style>%s</style>", buf.String())
}
