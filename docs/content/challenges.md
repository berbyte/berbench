---
sidebar_label: Tasks
---

# Tasks

A task is one previously solved issue, rebuilt as a controlled coding problem.
Creating a task is automated; deciding whether it is a fair measurement is not.

## What BERBench harvests

From a merged pull request, BERBench records:

- the issue text as the prompt;
- the commit before the fix as the starting tree;
- changed test files as `tests.patch`; and
- all other implementation changes as `reference.patch`.

The agent receives only the prompt and starting tree. Provenance, hidden tests,
reference patch, and upstream answer location remain outside its container.

## Find candidates

```bash
berbench task scan --json
```

`scan` reads local history, maps merged pull requests, and ranks changes that
touch both tests and implementation. `--json` emits one machine-readable
document and never prompts. Use `--limit N` (1–200) to control how many
candidates are considered.

Prefer a small, single-concern fix with a useful linked issue. A pull request
that changes many subsystems, contains no problem statement, or merely updates
tests for already-correct behavior makes a poor task.

Set `harvest.test_patterns` before creating anything. These patterns decide the
test/reference split at harvest time; changing them later requires recreating
affected tasks.

## Create, then stop

```bash
berbench task create 13964
```

The argument may be a pull-request number or URL. BERBench proves the landing
commit against local history, writes an unvalidated task, and stops for review:

```text
.ber/bench/tasks/13964/
├── task.yaml          # provenance and verification contract
├── prompt.md          # the only task text shown to the agent
├── tests.patch        # hidden verifier changes
└── reference.patch    # known implementation
```

## Review the draft

| Check | Why it matters |
| --- | --- |
| The prompt asks for exactly what the hidden tests verify. | Extra requirements create false failures; missing requirements reward guessing. |
| The prompt contains no repository URL, pull-request URL, commit, or other answer location. | An agent must solve the task, not retrieve the merged answer. |
| `tests.patch` contains tests only. | Implementation in the hidden patch gives the verifier part of the answer. |
| `reference.patch` is non-empty and contains the known fix. | Validation needs a real positive control. |
| `verify.command` exercises the changed behavior. | A full suite is slow and imports unrelated failures; a command that runs no tests proves nothing. |
| `verify.protected_paths` covers hidden test paths. | An agent must not pass by editing or deleting the verifier. |

If the split is wrong, update `harvest.test_patterns` in project config and
recreate the task. If the prompt leaks provenance, edit it before validation.

## Validate

```bash
berbench task validate 13964
```

Validation runs the hidden verifier twice in clean Docker containers:

1. At `base_commit`, it must fail.
2. With `reference.patch`, it must pass.

The command writes a validation fingerprint only when both checks succeed.
Never write or copy a `validation:` block by hand. Any change to the prompt,
patches, commands, project image, or other bound input makes the proof stale;
stale and unvalidated tasks are skipped by runs.

## Diagnose a failed validation

| Result | Likely cause |
| --- | --- |
| Base passes | The hidden test does not reproduce the old bug, or the wrong base commit was selected. |
| Reference fails | The project image or command is wrong, or part of the implementation was misclassified into `tests.patch`. |
| Patch does not apply | The patch split and base commit do not describe the same change. |
| Setup fails | A build or test dependency is absent from `Dockerfile.berbench`. |
| Verification times out | Narrow the command to the changed tests or raise the task timeout only when the focused test genuinely needs it. |

An exit code alone is not proof that the intended test ran. Read the verifier
log whenever the test runner reports collection, import, or setup errors.
