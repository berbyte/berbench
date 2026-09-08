---
sidebar_label: Workflow pipelines
---

# Benchmark workflow pipelines

A workflow is a tool composed of ordered agent steps: for example, plan → build
or plan → build → review. All steps share one container and working tree, run
sequentially, and fail fast. BERBench verifies the final patch once and records
metrics and artifacts per step.

Use workflows to test a concrete division-of-labor question. Keep a single-tool
arm as a control when you want to know whether the pipeline is worth its added
time and cost.

## Define a workflow

Create `.ber/bench/tools/plan-build.yaml`:

```yaml title=".ber/bench/tools/plan-build.yaml"
apiVersion: bench.ber.run/v1alpha1
kind: Workflow
tool: plan-build
type: workflow

steps:
  - name: plan
    tool: claude-code
    model: opus-5
    effort: medium
    timeout: 15m
    prompt: |
      Plan a fix for the task below. Do not edit {workdir}.
      Write a concise plan to {handover}/plan.md.

      {prompt}

  - name: build
    tool: codex
    model: gpt-5.6-terra
    effort: medium
    prompt: |
      Implement {handover}/plan.md in {workdir}.
      Correct the plan when the code proves it wrong.

      {prompt}
```

Each step names an existing registry tool. Its model and effort must be valid
for that tool, and the host must provide every credential route required by the
resolved steps. The cell's network allowlist is the union of those tools' model
API rules, not every tool installed in the bundle.

A step timeout is nested inside the cell timeout: it can stop a planner from
consuming the entire budget but never extends the cell deadline.

## Keep notes out of the patch

| Placeholder | Value |
| --- | --- |
| `{prompt}` | Task prompt |
| `{workdir}` | Shared graded working tree, normally `/workspace` |
| `{handover}` | Shared notes directory outside the working tree |

`BERBENCH_HANDOVER` contains the handover path too. Put plans, review notes,
and intermediate reports there. A file written under `{workdir}` becomes part
of the candidate patch and is graded.

BERBench snapshots new handover files after each step and stores them with that
step's artifacts.

## Sweep a step

Create an evaluation with a workflow arm and a direct-builder control:

```yaml title=".ber/bench/evaluations/planner-sweep.yaml"
apiVersion: bench.ber.run/v1alpha1
kind: Evaluation
attempts: 3

tools:
  - tool: plan-build
    steps:
      plan:
        model: [opus-5, sonnet-5]
        effort: [medium, high]
      build:
        model: sonnet-5
        effort: medium

  - tool: codex
    model: gpt-5.6-terra
    effort: medium
```

The workflow arm has `2 planner models × 2 efforts × 3 attempts = 12` cells
per task. The control adds three. Values omitted from `steps` remain fixed by
the workflow definition and do not multiply the matrix.

## Validate and run

```bash
berbench doctor
berbench evaluation validate planner-sweep
berbench run planner-sweep --task 811 --dry-run
```

Confirm that the resolved combinations answer the intended question. After
reviewing the paid cell count, run the same command without `--dry-run`.

Workflow cell cost is the sum of step costs. If a required model price is
unknown, the whole workflow cost remains unknown rather than reporting a
partial total.
