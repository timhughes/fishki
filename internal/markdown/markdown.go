package markdown

import (
	"github.com/russross/blackfriday/v2"
)

func Render(markdown []byte) []byte {
	return blackfriday.Run(markdown)
}
