# Troubleshooting

Symptom → cause → action.

## Harvesting

**The test patch is empty.**
The PR changed no file matching `harvest.test_patterns`. Either the patterns are
wrong for this repo's layout, or the PR genuinely added no tests — which makes it
a bad challenge, because there is nothing to verify against. Fix
`harvest.test_patterns` in `.ber/bench/config.yaml` and re-create, or pick
another PR.

**The gold patch is empty.**
The opposite failure of the same cause: the patterns are broad enough that every
changed file was classified as a test, leaving no fix. Narrow them and re-create.

**The prompt is empty or is about something else.**
`harvest.prompt_source` is `issue` by default. If this project's issues are thin
and the PR description carries the real bug report, set it to `pr_description`
and re-create.

**The prompt covers several issues.**
Confirm the hidden tests cover all of them. If not, cut `issue.md` down to the
behavior `tests.patch` actually checks.

## Lint

**Findings that `--fix` will not remove.**
`--fix` only strips berbench's own generated provenance footer and redacts
matched tokens. A sentence a human wrote — "this is the same as the fix in the
upstream repo owner/project" — needs a rewrite by hand. Rewrite it to describe
the *behavior*, not its provenance; the URL is already in `challenge.yaml`,
which the agent never sees.

**Lint flags a hex string that is not a commit.**
Any 7–40 char hex run is checked, but only ones that prefix the base or fix
commit are findings. If a log excerpt in the prompt genuinely contains such a
string, reword or trim that excerpt.

## Validation

**The base already passes** (`base_fail: false`).
The hidden test does not reproduce the old bug, or the wrong base commit was
selected. Read `tests.patch`: does the new test actually fail without the fix?
If the PR's test was a refactor of an existing passing test, this PR is not a
challenge.

**The gold patch still fails** (`gold_pass: false`).
Three candidates, in order of likelihood: the image is missing a test
dependency; `verify.script` is wrong (wrong runner, wrong path, wrong working
directory); or the test/gold split left part of the fix inside `tests.patch`.
Check the split first — it is the one that is invisible from the error message.

**Validation is slow or the build output is noise.**
`berbench challenge validate <id> --quiet` suppresses image build output. The
project image is cached on `(base_commit, Dockerfile)`, so the first challenge
at a given commit pays for the build and the rest are fast.

## Environment

**Docker daemon unreachable.**
`berbench doctor` fails at the toolchain section. Start the daemon and confirm
the current user can reach the socket. Nothing else in berbench works without it.

**No Dockerfile.**
`the image definition ... does not exist` — berbench never generates one. See
`references/setup.md` for the contract and per-ecosystem starting points, then
point `dockerfile:` in `.ber/bench/config.yaml` at it.

**Results directory is inside the repository.**
`doctor` fails. Results are deliberately not committed; move the results
directory out of the repo tree.

**Missing host token.**
`challenge create` and `scan` (without `--no-api`) need the git host. GitHub:
`GITHUB_TOKEN`/`GH_TOKEN` or `gh auth login`. GitLab: `GITLAB_TOKEN` or
`glab auth login`. `scan --no-api` works offline by reading PR numbers out of
commit messages. Never print a token's value.

**No provider detected.**
`source.provider` is unset in `.ber/bench/config.yaml`; `challenge create` will
not work until it is. `berbench init --remote <name>` detects from a different
git remote than `origin`.

## Runs

**Unknown model / unknown effort / unknown option.**
Hard errors, by design — a typo must not silently resolve to a default. The
error prints the known values and the exact overlay path to write if the value
is real but new. See `references/experiments.md`.

**A cell reports unknown cost.**
The model has no entry in `pricing.yaml`, so the run has a cost floor rather
than a total, and that configuration does not rank on cost. `doctor` warns about
unpriced models up front. Add prices to `~/.config/ber/bench/pricing.yaml`; it
merges over the shipped table key by key, so name only what you add.

**The agent cannot reach its API.**
Agent egress is an allowlist. The tool's own API host is allowed by default;
anything else the agent needs must be added explicitly with `--allow-host` or
`agent.allow_hosts`. **A code-forge host is a hard error with no override** —
adding one turns the run into a measurement of how fast a model finds a public
diff.

**A run was interrupted.**
Just run it again. Completed cells are reused by fingerprint and are not billed
twice. Do not reach for `--fresh` — that discards exactly the work you already
paid for.

**A run reports fewer challenges than expected.**
Unvalidated challenges are silently skipped. Run `berbench challenge list` and
check every challenge you expect has a passing `validated:` block.

**Everything errors with no measurement.**
Check the tool's credential before blaming the matrix: Claude Code wants
`ANTHROPIC_API_KEY` / `CLAUDE_CODE_OAUTH_TOKEN` / `~/.claude/.credentials.json`,
Codex wants `OPENAI_API_KEY` / `~/.codex/auth.json`.
