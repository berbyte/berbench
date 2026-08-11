// Package skills carries the berbench agent skill as embedded files.
//
// The skill tree lives here, at the repository root, rather than under
// internal/, because it has to satisfy two consumers at once. `go:embed` paths
// cannot contain "..", so the embedding package must sit at or above the
// embedded tree; Claude Code expects plugin skills at
// <plugin-root>/skills/<name>/SKILL.md. A `package skills` file at
// skills/embed.go is the one placement that satisfies both without duplicating
// the content. Skill loaders scan skills/*/SKILL.md and ignore this .go file.
package skills

import (
	"embed"
	"io/fs"
)

//go:embed berbench
var files embed.FS

// Name is the skill's directory name and the name in its frontmatter.
const Name = "berbench"

// FS returns the skill tree rooted at the skill directory itself, so that
// walking it yields "SKILL.md" and "references/..." rather than paths prefixed
// with the skill name.
func FS() fs.FS {
	sub, err := fs.Sub(files, Name)
	if err != nil {
		// Unreachable: the embedded directory is a compile-time constant.
		panic(err)
	}
	return sub
}
