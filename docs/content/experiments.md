---
sidebar_label: Evaluations
---

# Evaluations

An evaluation defines which coding setups to compare. It does not select tasks:
a run uses every validated, non-stale task unless `--task` narrows the run.

## Create a file

```bash
berbench evaluation create baseline
```

Interactive creation asks for tools, models, efforts, and attempts. Without a
terminal, it writes a commented template. Existing files are never replaced.

Every file is strict, versioned YAML:

```yaml title=".ber/bench/evaluations/baseline.yaml"
apiVersion: bench.ber.run/v1alpha1
kind: Evaluation
attempts: 3

tools:
  - tool: claude-code
    model: [sonnet-5, opus-5]
    effort: medium

  - tool: codex
    model: gpt-5.6-terra
    effort: [medium, high]
```

A scalar and a one-item list mean the same thing. Lists inside a tool block
form a cross product; separate blocks are unioned. The example resolves to
`2 Claude setups + 2 Codex setups`, repeated three times: 12 cells per task.

## Change one thing at a time

Only list an option when it is an intentional evaluation axis. Omitted options
use the registry default in every arm.

```yaml
apiVersion: bench.ber.run/v1alpha1
kind: Evaluation
attempts: 3

tools:
  - tool: codex
    model: gpt-5.6-terra
    effort: high
    options:
      agents_md: [default, none]
```

This isolates the effect of repository instructions. If model, effort, prompt,
tool version, and project image all change together, the result cannot explain
which change mattered.

## Tool versions and setup hooks

`tool_version` is an axis like `model` or `effort`:

```yaml
tools:
  - tool: claude-code
    tool_version: [latest, 2.1.0]
    model: sonnet-5
    effort: medium
```

An evaluation block may also declare `pre` commands for an intentional setup
mutation. Their commands and captured effects become part of the cell identity.
A setup whose effects cannot be safely content-addressed is not reusable.

## Workflow steps

Workflow tools expose their step choices as nested axes:

```yaml
tools:
  - tool: plan-build
    steps:
      plan:
        model: [opus-5, sonnet-5]
        effort: [medium, high]
      build:
        model: sonnet-5
        effort: medium
```

Step values in the evaluation override the workflow definition. See
[Workflow pipelines](how-to/workflows.md) for the full contract.

## Validate before spending

```bash
berbench evaluation validate baseline
# Equivalent shorthand:
berbench eval validate baseline
```

Validation resolves every block and rejects unknown tools, versions, models,
efforts, options, and values. It starts no containers and cannot tell whether a
cell is cached, because image digests are part of cell identity. The run preview
answers that:

```bash
berbench run baseline --dry-run
```

## Read outcomes correctly

Reusable verdicts are `passed`, `failed`, `patch_apply_failed`,
`guard_violation`, and `no_changes`. Execution failures are `timeout`,
`adapter_error`, and `infrastructure_error`; they are attempted cells but are
not reused as measurements. Only `passed` counts as a pass.

Rank by correctness first. Compare cost, tokens, patch size, and time only over
the set of tasks both configurations measured. Unknown cost is `null`, never
zero, and is excluded from totals.
