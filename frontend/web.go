package web

import (
	"embed"
)

//go:embed dist
var WebBuild embed.FS
