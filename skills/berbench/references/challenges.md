# Challenges

A challenge is one old bug, validated. `create` produces **drafts**; `lint` and
`validate` only *reject* bad ones. Turning a draft into something worth
measuring is judgment work — that is this procedure.

## Find

```bash
berbench challenge scan --max-gold-files 3 --json
```

Use `--json`; it is the machine-readable form. Useful flags:

| Flag | Use |
|---|---|
| `--max-gold-files N` | reject PRs touching more than N non-test files |
| `--since 2026-01-01` (or `720h`) | only recent commits |
| `--limit N` / `--max N` | commits walked / candidates reported |
| `--sort tests` | order by test churn instead of date |
| `--no-api` | never call GitHub/GitLab; map PRs from commit messages only |
| `--verbose` | also list rejected commits and why |

Prefer **small, single-concern fixes that touch both tests and non-test code**.
A PR that changes twelve files across three subsystems makes a challenge no
model solves, which measures nothing.

## Create, then stop and review

```bash
berbench challenge create 13964
```

This writes:

```text
.ber/bench/challenges/13964/
├── challenge.yaml   # source, environment, verifier, provenance
├── issue.md         # the prompt the agent sees
├── tests.patch      # hidden tests
├── gold.patch       # the known fix
└── raw/             # source material saved during harvesting
```

**Now review it.** Read `raw/pr.diff` and all four generated files, then check
each row and fix in place. Edit the files directly — never `challenge edit`.

| Check | Fix if wrong |
|---|---|
| `issue.md` describes **only** behavior the hidden tests verify | Rewrite it. Drop unrelated reported symptoms, environment chatter, and "also noticed…" asides. If the hidden tests check three things, the prompt must ask for three things. |
| `issue.md` names no PR, repo, commit, or forge URL | `berbench challenge lint <id> --fix` strips berbench's own generated footer; anything a human wrote, edit by hand. |
| `tests.patch` contains **tests only** | A misclassified file means `harvest.test_patterns` is wrong. Fix the patterns in `.ber/bench/config.yaml`, then re-create the challenge — the split happens at harvest time. |
| `gold.patch` is non-empty and is the actual fix | Empty means the patterns swallowed every changed file. Same fix: narrow the patterns, re-create. |
| `verify.script` is the **smallest** command that exercises the bug | Narrow it to the specific test file or test case added by `tests.patch`. A whole-suite run makes every unrelated flake look like a failed solve, and costs time on every cell. |
| `verify.guard.protect` covers what an agent could edit to cheat | Add the test directories the patch touches. An agent that can edit the hidden test can pass by deleting it. |

The prompt is the entire task specification. Judge it by one question: *could a
competent engineer who has never seen this repo's PR produce a fix that passes
the hidden tests, from this text alone?* If not, it is under-specified. If it
says more than the tests check, it is over-specified and unfairly hard.

## Lint

```bash
berbench challenge lint 13964
berbench challenge lint 13964 --fix
```

Lint proves a negative: that the prompt does not say where the answer is. This
is not paranoia — in an early measured run, five of seven cells "solved" a
challenge by fetching the upstream diff, four of them via a URL berbench itself
had appended.

A prompt line is a finding when it contains any of:

- the pull request URL this challenge was harvested from;
- the upstream repository, as `host/owner/repo` **or** bare `owner/repo`;
- any code-forge host: `github.com`, `gitlab.com`, `githubusercontent.com`,
  `patch-diff.githubusercontent.com`, `bitbucket.org`, `codeberg.org`, `sr.ht`;
- a reference to **this challenge's own id** — `#13964`, `pull/13964`,
  `!13964`, `merge_requests/13964`. An unrelated issue number is fine;
- a 7–40 character hex run that is a prefix of (or is prefixed by) the base
  commit or the fix commit.

Write `issue.md` with these in mind and lint passes first time. `--fix` only
removes the machine-written provenance footer and redacts matched tokens with
`[redacted]`; a human-written sentence that leaks needs a human-quality rewrite,
not a redaction hole.

Provenance is not lost — it lives in `challenge.yaml` under `source:` and
`harvest.refs`, which the agent never sees.

## Validate

```bash
berbench challenge validate 13964
```

Runs lint first and **refuses to mark a leaking challenge validated**. Then it
proves two things in clean containers:

1. `base_fail: true` — the hidden tests fail at `base_commit`.
2. `gold_pass: true` — they pass once `gold.patch` is applied.

Both must be true. Otherwise a passing agent result proves nothing: if the base
already passes, the test does not reproduce the bug; if gold still fails, the
environment or the verify command is wrong.

Only `validate` may write the `validated:` block. Never hand-write it.

**Do not proceed past an unvalidated challenge.** Runs silently skip it — you
will get a clean-looking report measured on fewer challenges than the user
thinks. Use `--quiet` to suppress image build output when the build is noisy.

When something fails here, go to `references/troubleshooting.md`.
