---
sidebar_label: Experiments
---

# Experiments

An experiment says which AI coding configurations to compare. It is a matrix of
tool, model, effort, options, and attempts.

Experiments do not select challenges. A run uses every validated challenge by
default. Use `--challenge` when you want only specific ones.

## Start from a full scaffold

With only a name, `create` writes a file listing every tool, model and effort
BERBench knows about, all active, one per line — delete the lines you do not
want:

```bash
berbench experiment create full
berbench experiment validate full
berbench run full --dry-run
```

Models that have no price in `pricing.yaml` are partner-operated and arrive
commented out, with the reason on the line: they need extra options and
credentials, so an unedited scaffold has no cells that are guaranteed to fail.

## Create a small experiment

Naming the configurations directly works too:

```bash
berbench experiment create smoke \
  claude-code/opus-5/high \
  codex/gpt-5.6-terra/medium
```

This writes `.ber/bench/experiments/smoke.yaml`:

```yaml
tools:
  - tool: claude-code
    model: [opus-5]
    effort: [high]

  - tool: codex
    model: [gpt-5.6-terra]
    effort: [medium]
```

Tool blocks are added together. Lists inside one block form a cross product.

For example:

```yaml
attempts: 3

tools:
  - tool: claude-code
    model: [opus-5, sonnet-5]
    effort: [medium, high]
```

This produces `2 models × 2 efforts × 3 attempts = 12` cells per challenge.

## Sweep an option

Only list an option when you want it to be an experiment axis. Unlisted options
stay at the tool registry default.

```yaml
attempts: 3

tools:
  - tool: claude-code
    model: [sonnet-5]
    effort: [high]
    options:
      project_doc: [default, none]

  - tool: codex
    model: [gpt-5.6-terra]
    effort: [high]
    options:
      project_doc: [default, none]
```

This compares each tool with and without repository instructions.

## Rules

- Every tool block must contain `model` and `effort`, even for one value.
- Every model must support every effort in the same block.
- Unknown tools, models, efforts, options, and option values are errors.
- `attempts` repeats every matrix point.
- `concurrency` controls how many cells run at once; it does not change the
  matrix.
- `defaults.cell_timeout` (or a challenge's `timeout:`) bounds one cell's agent
  phase. Each model x effort x attempt gets it in full; there is no cap on the
  run as a whole.

Validate before spending money:

```bash
berbench experiment validate smoke
berbench experiment validate smoke --verbose
```

The verbose form prints every resolved cell.

## Reading a result

One cell is one complete configuration run against one challenge. A cell can:

- pass: the candidate patch passes the hidden verifier;
- fail: the agent ran, but its patch did not pass;
- error: setup, tool execution, or verification could not complete;
- be reused: an identical completed cell already exists.

`berbench report latest` ranks complete configurations by pass rate, then cost,
tokens, lines changed, and time.
