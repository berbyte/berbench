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
| `--limit N` / `--max N` | commits walked / candidates reported |
| `--since` | `2026-01-31`, or a duration: `90d`, `6w`, `3m`, `1y` |
| `--sort` | `score` (default), `date`, `tests` |
| `--min-tier A\|B\|C` / `--include-all` | raise or drop the prompt-quality floor |
| `--require-issue` | drop anything with no resolved issue reference |
| `--no-api` | map from commit messages only, spending no API calls |
| `--verbose` | also list what was rejected and why |
| `--json` | the machine-readable result — always use it |
| `--create` | harvest every mapped candidate; asks first, and refuses with no terminal |

`--require-issue` is the one worth reaching for deliberately. A prompt written
from a pull request description restates the fix — often verbatim — so a
challenge built on one measures reading comprehension. If it returns nothing on
a project that clearly has issues, that project probably tracks them somewhere
other than the forge: see the issue-tracker step in `references/setup.md`.

Candidates come back best-first, ranked by the prompt they would produce. A
change with neither a linked issue nor a written description is not reported at
all: its prompt would describe nothing the hidden tests check.

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
each row and fix in place. Edit the files directly with your own tools.

| Check | Fix if wrong |
|---|---|
| `issue.md` describes **only** behavior the hidden tests verify | Rewrite it. Drop unrelated reported symptoms, environment chatter, and "also noticed…" asides. If the hidden tests check three things, the prompt must ask for three things. |
| `issue.md` names no PR, repo, commit, or forge URL | `berbench challenge lint <id> --fix` strips BERBench's own generated footer; anything a human wrote, edit by hand. |
| `tests.patch` contains **tests only** | A misclassified file means `harvest.test_patterns` is wrong. Fix the patterns in `.ber/bench/config.yaml`, then re-create the challenge — the split happens at harvest time. |
| `gold.patch` is non-empty and is the actual fix | Empty means the patterns swallowed every changed file. Same fix: narrow the patterns, re-create. |
| `verify.script` names the tests `tests.patch` adds | **Do not hand-write it.** `challenge create` derives it from the patch; if it is wrong, run `berbench challenge reselect <id>`, never edit it by hand. See "The verify script is derived" below. |
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
challenge by fetching the upstream diff, four of them via a URL BERBench itself
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

## The verify script is derived, not written

`challenge create` reads `tests.patch`, finds every test it **adds or changes**,
and emits the selector for this repository's runner. It is not a suggestion —
it is the thing to trust.

A hand-written selector is the most expensive mistake available here, because it
fails silently. `basic.ModelFromDbTests` is missing its module segment and
resolves to nothing; Django's loader reports `unittest.loader._FailedTest`,
exits 1, and an exit code alone reads that as "the bug reproduces". Three real
Django challenges were recorded as `base_fail: true` while zero tests ran.

If the script is wrong, **re-derive it**:

```bash
berbench challenge reselect 13964            # rewrites verify.script from tests.patch
berbench challenge reselect --dry-run        # every challenge, changing nothing
```

`reselect` clears any `validated:` block, because the old verdict was about a
different command. Re-run `validate` afterwards.

If you must read or check a selector, this is the grammar per runner:

| Stack | Selector |
|---|---|
| Django (`tests/runtests.py`) | `app.module.Class.method` — `tests/basic/tests.py` → `basic.tests.ModelFromDbTests`. **The module segment is the part everyone forgets.** |
| pytest | `path/to/test_x.py::TestClass::test_method` |
| Go | `go test -v ./pkg -run '^(TestA\|TestB)$'` — one command per package, and `-v` so passes are counted |
| jest / vitest | `npx vitest run <file> -t '<name>'` |
| cargo | `cargo test --test <target> -- --exact <name>` |
| rspec | `bundle exec rspec path:LINE` |
| maven | `mvn -q -Dtest=Class#method test` |

When berbench cannot extract a symbol it falls back to a file- or module-level
command and marks it `# UNVERIFIED`. That is coarse but correct — it runs the
right tests plus some others. Narrow it only if a cell is slow, and re-validate
after.

## Validate

```bash
berbench challenge validate 13964
berbench challenge validate --json         # every challenge, machine-readable
berbench challenge validate --quiet        # one line per challenge
```

Runs lint first and **refuses to mark a leaking challenge validated**. Then it
proves two things in clean containers:

1. `base_fail: true` — the hidden tests fail at `base_commit`.
2. `gold_pass: true` — they pass once `gold.patch` is applied.

Both must be true. Otherwise a passing agent result proves nothing.

**Failing is not sufficient for `base_fail`.** berbench reads what the test
runner itself reported — how many tests it found, how many ran, how many failed
— and refuses to record `base_fail` unless tests actually ran and actually
failed. The `validated:` block carries that evidence:

```yaml
validated:
  base_fail: true
  gold_pass: true
  runner: django
  tests_ran: 6
```

A block claiming `base_fail: true` with `tests_ran: 0` measured nothing.
`doctor` fails on it.

Only `validate` may write this block. Never hand-write it.

**Do not proceed past an unvalidated challenge.** Runs silently skip it — you
will get a clean-looking report measured on fewer challenges than the user
thinks.

## When validate fails: the decision table

Use `--json`. Every phase carries a `diagnosis` code and a one-line `remedy`.
**Do not open a log unless `diagnosis` is empty.**

```json
{"id":"21749","ok":false,
 "base":{"status":"no_tests_ran","exit":1,"runner":"django","ran":1,"failed":0,
         "errored":1,"counted":true,"diagnosis":"tests_not_collected",
         "remedy":"verify.script names tests that do not exist — run ...",
         "detail":"ModelFromDbTests (unittest.loader._FailedTest...) ... ERROR",
         "log_path":"…/validate/21749/base.log"}}
```

| `diagnosis` | What happened | Do this |
|---|---|---|
| `tests_not_collected` | The runner never ran the named tests, or aborted before starting. | Read `detail`. If it names a missing capability (`A GIS database backend is required`), that belongs in `Dockerfile.berbench`. Otherwise `berbench challenge reselect <id>`, then validate again. |
| `missing_dependency` | Something the tests import is not in the image. | Add it to `Dockerfile.berbench`. The verify phase has no network — installing it in `environment.setup` will not work. |
| `network_denied` | The verify phase tried to reach the network. | Move the fetch into `Dockerfile.berbench`, which builds with full network. |
| `patch_conflict` | `tests.patch` or `gold.patch` will not apply at `base_commit`. | The tests/gold split is wrong for this commit. Check `harvest.test_patterns` and re-create the challenge. |
| `base_already_passes` | Tests ran at base and all passed. | `tests.patch` does not reproduce the bug. Read it: if the PR only refactored an existing passing test, this PR is not a challenge. |
| `gold_still_fails` | Tests ran with the fix and still failed. | Usually the split left part of the fix inside `tests.patch`; check that first, it is invisible from the error text. Then check the image for a missing test dependency. |
| `gold_ran_fewer` | Gold passed, but ran fewer tests than base did. | `gold.patch` is shadowing or removing a hidden test. Re-check the split. |
| `timeout` | The verify script exceeded 15 minutes. | Narrow `verify.script` to the tests `tests.patch` added — `reselect` does this. |
| *empty* | berbench could not recognize the runner in the output. | Only now read `log_path`. A bespoke verify script gets no diagnosis because there is no runner account to compare the exit code against. |

For anything not covered here, go to `references/troubleshooting.md`.
