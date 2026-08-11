---
sidebar_label: Agent skill
---

# Agent skill

berbench automates what can be checked mechanically. Two steps in the workflow
are left to a person on purpose, and they are where new users stall:

- **Writing `Dockerfile.berbench`.** `init` never generates one. Something has
  to read the repository — its lockfiles, its CI workflow — and work out how the
  project installs and how its tests really run.
- **Reviewing a freshly harvested challenge.** `challenge create` produces
  drafts. `lint` and `validate` can only reject a bad one; deciding whether
  `issue.md` describes exactly the behavior the hidden tests check, and whether
  the test/gold split is right, is judgment work.

A coding agent is well suited to both. The berbench skill gives it berbench's
own rules so it does that work correctly instead of guessing.

## Install

Claude Code, as a plugin:

```
/plugin marketplace add ber-run/berbench
/plugin install berbench@berbench
```

Any agent that reads a directory of skills:

```bash
berbench skill install
```

With no flags this writes to every agent configuration directory it finds —
`~/.claude/skills/berbench/`, `~/.codex/skills/berbench/`. If it finds none it
writes nothing and prints the manual instructions instead.

```bash
berbench skill install --claude          # one target explicitly
berbench skill install --dir ./skills    # anywhere
berbench skill install --project         # ./.claude/skills, so a team can commit it
berbench skill print                     # SKILL.md to stdout, for piping elsewhere
berbench skill list                      # where it is installed, and at what version
```

Install stamps the installed `SKILL.md` with the berbench version that wrote it.
That makes upgrades decidable: a copy berbench wrote is replaced by a newer
berbench without asking, a copy already at this version is left alone, and a
`SKILL.md` berbench did not write is never overwritten without `--force`.

## What it contains

A short `SKILL.md` router plus four references the agent loads only when the
task needs them:

| Reference | Covers |
|---|---|
| `setup.md` | `init` and `doctor`, the `Dockerfile.berbench` contract and per-ecosystem starting points, credentials, `harvest.test_patterns` |
| `challenges.md` | `scan` → `create` → the review checklist → `lint` → `validate`, with the lint rules spelled out |
| `experiments.md` | intent to matrix, the cost arithmetic, `validate` → `--dry-run` → approval → `run`, reading a report |
| `troubleshooting.md` | symptom → cause → action for the known failure modes |

## The rules it enforces

These live in `SKILL.md` itself, never behind a reference, because each one
either costs money or silently invalidates a result:

- Never run `berbench run` without showing `--dry-run` output first and getting
  explicit approval. It bills real API usage.
- Never run `challenge edit` or `experiment edit` — they open `$EDITOR` and hang
  a non-interactive agent. Edit the files under `.ber/bench/` directly.
- Never hand-write the `validated:` block. Only `challenge validate` may.
- Never add a code-forge host to the egress allowlist.
- Never put a PR URL, repository name, or commit hash into `issue.md`.
- Commit `.ber/bench/`; never commit results.

The skill ships in the berbench repository and is versioned with the CLI, so the
rules an agent follows are the rules the binary enforces.
