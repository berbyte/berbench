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
/plugin marketplace add berbyte/berbench
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
berbench skill install --ref v1.2.0      # pin a branch, tag or commit
berbench skill print                     # SKILL.md to stdout, for piping elsewhere
berbench skill list --check              # where it is installed, and whether it is current
```

## How it updates

The files come from this repository, not from inside the binary, so a fix to the
rules reaches your agent as soon as it lands here — no CLI release needed.
`install` follows `main` unless you pass `--ref`.

That means the first install needs network. It resolves the ref to a commit,
downloads that commit's skill tree once, and caches it under your user cache
directory; later installs of a commit you already have touch the network only to
ask what `main` points at now, and fall back to the last answer they got when
GitHub is unreachable.

Install stamps the installed `SKILL.md` with the commit it came from:

```
<!-- installed by berbench from berbyte/berbench@25259c06b455… -->
```

That makes upgrades decidable. A copy berbench wrote is replaced without asking,
a copy already at that commit is left alone, and a `SKILL.md` berbench did not
write is never overwritten without `--force`. Because the whole tree is replaced
rather than written file by file, a reference the skill stops shipping stops
being installed.

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

The skill lives in [berbyte/berbench](https://github.com/berbyte/berbench)
alongside this documentation, and both the plugin and `berbench skill install`
serve it from there — so the rules an agent follows are the rules written down
here.
