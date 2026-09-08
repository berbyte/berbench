---
sidebar_label: Run your first evaluation
---

# Run your first evaluation

Start with one validated task, two setups, and one attempt. A small smoke run
finds configuration and environment problems before they become an expensive
matrix.

## 1. Check the repository

```bash
cd /path/to/repository
berbench doctor
```

Resolve every failure before continuing.

## 2. Create one task

```bash
berbench task scan --json
berbench task create 13964
```

Review the generated directory before validating it:

```text
.ber/bench/tasks/13964/
├── task.yaml
├── prompt.md
├── tests.patch
└── reference.patch
```

Confirm that the prompt states only behavior the hidden tests measure, the
patch split is correct, the verification command is focused, and protected
paths prevent the agent from changing hidden tests.

Then validate:

```bash
berbench task validate 13964
```

Do not continue until the task records both `base_failed: true` and
`reference_passed: true`. Only `task validate` may write that proof.

## 3. Create the evaluation

```bash
berbench evaluation create smoke
```

In an interactive terminal, `create` asks which tools, models, efforts, and
attempt count to use. Without a terminal it writes a small commented template.
Edit `.ber/bench/evaluations/smoke.yaml` into a two-arm comparison:

```yaml title=".ber/bench/evaluations/smoke.yaml"
apiVersion: bench.ber.run/v1alpha1
kind: Evaluation
attempts: 1

tools:
  - tool: claude-code
    model: sonnet-5
    effort: medium

  - tool: codex
    model: gpt-5.6-terra
    effort: medium
```

Use model keys supported by the registry installed with your BERBench release.

## 4. Resolve the matrix

```bash
berbench evaluation validate smoke
```

This validates configuration and prints the resolved arms and cell count. It
starts no containers and contacts no service. `berbench eval` is the one
supported command alias, so `berbench eval validate smoke` is equivalent.

## 5. Preview the real run

```bash
berbench run smoke --task 13964 --dry-run
```

The run preview is authoritative because it resolves image and tool inputs and
can say which cells are already measured. Inspect the paid cell count before
continuing.

## 6. Run

```bash
berbench run smoke --task 13964
```

In a terminal, BERBench asks for confirmation. In a non-interactive session,
an approved run must include `--yes`.

Press Ctrl-C once to stop scheduling and save completed work. Run the same
command again to reuse completed verdicts and remeasure incomplete or
non-reusable failures. `--fresh` deliberately remeasures every selected cell;
it does not delete earlier evidence.

## 7. Inspect and sync

Local results are always saved, whether or not Cloud is reachable. The
completed command prints the result and evidence locations; each run has an
immutable manifest and report, while each measured cell retains its execution
evidence.

When signed in and the Cloud service accepts uploads, a successful run syncs
automatically and prints the dashboard URL returned by the server. Otherwise:

```bash
berbench login
berbench sync --dry-run
berbench sync
```

`sync --dry-run` shows exactly what would leave the machine and its compressed
size. Uploads are idempotent and retry the immutable payload saved with the run.

## 8. Expand deliberately

After the smoke run works:

1. Increase `attempts` to reduce luck.
2. Add more validated tasks.
3. Add one model, effort, option, or workflow axis at a time.
4. Validate and dry-run again after each edit.

Compare configurations only across tasks both have measured. Correctness comes
first; cost, tokens, patch size, and time help distinguish configurations with
the same pass rate.
