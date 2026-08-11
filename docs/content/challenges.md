---
sidebar_label: Challenges
---

# Challenges

A challenge is one old bug for an AI coding tool to solve.

BERBench builds it from a merged pull request:

- The linked issue becomes the prompt.
- The commit before the fix becomes the starting code.
- Test changes become a hidden test patch.
- Non-test changes become the reference, or gold, patch.

The agent sees the prompt and starting code. It does not see the original pull
request, hidden tests, or reference patch.

## Find a good pull request

Start with a merged pull request that changed both production code and tests.
Smaller fixes usually make better first challenges.

```bash
berbench challenge scan
berbench challenge scan --max-gold-files 3
```

`scan` reads local git history. It prefers pull request numbers found in commit
messages and uses the host API only when needed.

Useful options:

```bash
berbench challenge scan --no-api       # never call GitHub or GitLab
berbench challenge scan --verbose      # show rejected commits and why
berbench challenge scan --max 2 --create
```

## Create a challenge

Pass the merged pull request number:

```bash
berbench challenge create 13964
```

This creates:

```text
.ber/bench/challenges/13964/
├── challenge.yaml   # source, environment, verifier, and provenance
├── issue.md         # the prompt shown to the agent
├── tests.patch      # hidden tests
├── gold.patch       # known fix
└── raw/             # source material saved during harvesting
```

Review the generated files:

```bash
berbench challenge edit 13964 --file prompt
berbench challenge edit 13964 --file challenge
berbench challenge edit 13964 --file tests
berbench challenge edit 13964 --file gold
```

Check these points:

- `issue.md` describes only the behavior that the hidden tests check.
- `issue.md` does not mention the fix PR, fix commit, or repository URL.
- `tests.patch` contains tests only.
- `gold.patch` contains the known fix and is not empty.
- `verify.script` runs the smallest useful test command.
- `verify.guard.protect` covers paths an agent might edit to bypass the test.

## Validate a challenge

```bash
berbench challenge lint 13964
berbench challenge validate 13964
```

Validation proves two things in clean containers:

1. The hidden tests fail on the starting commit: `base_fail: true`.
2. The hidden tests pass after applying the gold patch: `gold_pass: true`.

Both must be true. Otherwise, a passing agent result does not prove anything.
Unvalidated challenges are skipped by normal runs.

If the prompt leaks the answer location, edit it or let BERBench remove known
leaks:

```bash
berbench challenge lint 13964 --fix
```

## Common problems

**The test patch is empty.** The pull request did not add or change a file that
matches the test patterns. Fix `harvest.test_patterns` or choose another pull
request.

**The gold patch is empty.** Every changed file was classified as a test. Fix
the test patterns or choose another pull request.

**The base already passes.** The hidden test does not reproduce the old bug, or
the wrong base commit was selected.

**The gold patch still fails.** The image, setup, or verify command is wrong, or
the split left part of the fix in `tests.patch`.

**The prompt contains several issues.** Confirm that the hidden tests cover all
of them. Remove unrelated text from `issue.md` if necessary.
