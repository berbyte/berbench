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

**Every prompt says `prompt_source: pr_description`.**
Usually not a preference — usually this project has the forge's issue tracker
turned off, so every `#123` resolves to nothing. `berbench doctor` says so in
its Git host section and prints the `harvest.issue_tracker` block to write. See
step 5 of `references/setup.md`. A PR description restates the fix, so this is
not a cosmetic problem: it is a benchmark that measures reading.

**The linked issue could not be fetched and `issue.md` is a stub.**
`harvest.refs` in `challenge.yaml` records why. For a third-party tracker,
either the kind is one BERBench archives rather than parses (`bugzilla`,
`redmine`, `url`) or the URL template is wrong. `trac` and `jira` are read into
a real prompt; the rest need a human to write `issue.md` from `raw/`.

**The prompt covers several issues.**
Confirm the hidden tests cover all of them. If not, cut `issue.md` down to the
behavior `tests.patch` actually checks.

## Lint

**Findings that `--fix` will not remove.**
`--fix` only strips BERBench's own generated provenance footer and redacts
matched tokens. A sentence a human wrote — "this is the same as the fix in the
upstream repo owner/project" — needs a rewrite by hand. Rewrite it to describe
the *behavior*, not its provenance; the URL is already in `challenge.yaml`,
which the agent never sees.

**Lint flags a hex string that is not a commit.**
Any 7–40 char hex run is checked, but only ones that prefix the base or fix
commit are findings. If a log excerpt in the prompt genuinely contains such a
string, reword or trim that excerpt.

## Validation

**Start with `berbench challenge validate <id> --json`.** Each phase carries a
`diagnosis` code and a one-line `remedy`; the full decision table is in
`references/challenges.md`. Do not open a log while `diagnosis` is non-empty.

**`diagnosis: tests_not_collected`.**
The runner never ran the named tests. This is the single most common validation
failure and it used to be invisible — a broken selector exits non-zero, which an
exit code alone reads as "the bug reproduces". Read `detail`: if it names a
capability the image lacks (`A GIS database backend is required`), fix
`Dockerfile.berbench`. Otherwise run `berbench challenge reselect <id>` and
validate again. Never hand-edit `verify.script`.

**The base already passes** (`diagnosis: base_already_passes`).
The hidden test does not reproduce the old bug, or the wrong base commit was
selected. Read `tests.patch`: does the new test actually fail without the fix?
If the PR's test was a refactor of an existing passing test, this PR is not a
challenge.

**The gold patch still fails** (`diagnosis: gold_still_fails`).
Three candidates, in order of likelihood: the test/gold split left part of the
fix inside `tests.patch`; the image is missing a test dependency; or
`verify.script` targets the wrong tests. Check the split first — it is the one
that is invisible from the error message.

**Gold passed but ran fewer tests than base** (`diagnosis: gold_ran_fewer`).
`gold.patch` is shadowing or deleting a hidden test, so it proves nothing. Fix
the split.

**`validated:` says `base_fail: true` but `tests_ran: 0`.**
That block was written by a version of BERBench that could not check, and it
measured nothing. `doctor` fails on it. Run `reselect`, then `validate`.

**Validation is slow or the build output is noise.**
`--quiet` prints one line per challenge instead of the running commentary;
`--json` prints only the document. With `docker.image_mode: shared` (the
default once `env_commit` is pinned) the whole repository shares one image, so
only the first validate pays for a build. Use `--rebuild-env` to force a
cache-less rebuild.

## Environment

**Docker daemon unreachable.**
`berbench doctor` fails at the toolchain section. Start the daemon and confirm
the current user can reach the socket. Nothing else in BERBench works without it.

**No Dockerfile.**
`the image definition ... does not exist` — BERBench never generates one. See
`references/setup.md` for the contract and per-ecosystem starting points, then
point `dockerfile:` in `.ber/bench/config.yaml` at it.

**`the agent CLI runtime will not run in this image`.**
The project image is musl-based (Alpine). The agent CLIs are mounted in with a
glibc Node runtime that cannot execute there. Re-base `Dockerfile.berbench` on
a Debian or Ubuntu image — `-slim` and `-bookworm` variants are fine.

**`doctor` warns that no `docker.env_commit` is pinned.**
BERBench is building and storing one project image per challenge. Paste the
`docker:` block `doctor` prints into `.ber/bench/config.yaml`. On a repository
whose image is gigabytes this is the most expensive thing it does.

**`doctor` warns that a challenge's manifests moved away from `env_commit`.**
That challenge's base commit wants different dependencies than the shared image
installs. Either re-pin `docker.env_commit` and re-run with `--rebuild-env`, or
add `environment.image_mode: per-commit` to that one challenge.

**Results directory is inside the repository.**
`doctor` fails. Results are deliberately not committed; move the results
directory out of the repo tree.

**Missing host token.**
`challenge create` needs the git host, and `scan` uses it for commits whose
message carries no pull-request marker. GitHub:
`GITHUB_TOKEN`/`GH_TOKEN` or `gh auth login`. GitLab: `GITLAB_TOKEN` or
`glab auth login`. Without a token `scan` still runs, mapping whatever the
commit messages name. Never print a token's value.

**No provider detected.**
`source.provider` is unset in `.ber/bench/config.yaml`; `challenge create` will
not work until it is. `init` reads the host from `origin`, or from the sole
remote when there is exactly one — if the repository has several and none is
`origin`, rename one.

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

**A workflow step has no model.**
The step must receive a model from one of three layers: the experiment block's
top-level `model:`, the workflow's scalar step `model:`, or the experiment's
`steps.<name>.model:` list. Prefer pinning stable defaults in the workflow and
putting only measured axes in the experiment.

**A workflow cannot find a plan or review file.**
The producing step must write it to `{handover}` (also
`$BERBENCH_HANDOVER`), and the consuming prompt must read the same path. Do not
put handover notes in `{workdir}`: that includes them in the candidate patch.

**A mixed-tool workflow fails before the first step.**
Every step's tool needs usable credentials. BERBench prepares the entire
pipeline before starting it so a missing later credential does not spend tokens
on earlier steps. Check each underlying tool with `doctor`.
