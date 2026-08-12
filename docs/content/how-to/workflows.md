---
sidebar_label: Workflow pipelines
---

# Build and benchmark workflow pipelines

A workflow is an ordered pipeline of coding-agent invocations, such as plan →
build → review. All steps run sequentially in one container and one working
tree, so later steps see earlier code changes. BERBench verifies only the final
patch, while recording time, tokens, cost, exit status, artifacts, and handover
files for each step.

Use a workflow when the question is about division of labor: whether a stronger
planner helps a cheaper builder, whether a second tool catches defects in
review, or whether a context treatment improves one phase. Keep ordinary
single-agent cells as controls if the question is whether the pipeline is worth
its extra time and spend.

## Define the workflow tool

Create `.ber/bench/tools/plan-build-review.yaml` for a repository-specific
workflow, or put the same file under `~/.config/ber/bench/tools/` to reuse it:

```yaml title=".ber/bench/tools/plan-build-review.yaml"
tool: plan-build-review
type: workflow

steps:
  - name: plan
    tool: claude-code
    model: opus-5
    effort: high
    timeout: 10m
    prompt: |
      Plan a fix for the issue below. Do not edit {workdir} yet.
      Write the plan to {handover}/plan.md.

      {prompt}

  - name: build
    tool: claude-code
    model: sonnet-5
    effort: high
    prompt: |
      Implement {handover}/plan.md in {workdir}.

      {prompt}

  - name: review
    tool: codex
    model: gpt-5.6-terra
    effort: medium
    options:
      sandbox: workspace-write
    prompt: |
      Review the change in {workdir} against {handover}/plan.md.
      Fix anything incorrect; leave correct work intact.

      {prompt}
```

Each step names an existing registry tool. Its model, effort, and options are
validated against that tool, so the example needs credentials for both Claude
Code and Codex. BERBench prepares all step credentials before running the first
step. The cell's egress allowlist is the union of the API hosts required by its
resolved steps and option values; unrelated tools elsewhere in the experiment
do not widen it.

The challenge image receives one reusable tool layer containing every
installable CLI in the resolved registry. This keeps the image identical across
experiments and allows mixed-tool pipelines. Credentials and egress remain
cell-specific, so a CLI merely being on `PATH` does not make it usable.

`timeout:` bounds one step inside the challenge's or `defaults.cell_timeout`
budget. It prevents a planner from consuming the builder's time, but does not
extend the cell deadline. The pipeline is fail-fast and is verified once after
the last successful step.

## Hand work between steps

The prompt placeholders are:

| Placeholder | Value |
|---|---|
| `{prompt}` | Challenge prompt |
| `{workdir}` | Shared working tree, normally `/workspace` |
| `{handover}` | Shared notes directory, `/tmp/berbench/handover` |

The handover path is also exported as `$BERBENCH_HANDOVER`. Put plans, review
notes, and file lists there. It is deliberately outside the working tree:
anything written under `{workdir}` is captured in `agent.patch` and applied by
the verifier as part of the candidate solution.

BERBench snapshots newly written handover files after each step and stores them
with that step's declared artifacts under
`cells/<key>/steps/<index>-<name>/`.

## Sweep step choices

Experiment `steps:` entries override the workflow by step name. Every listed
model, effort, or option value becomes an axis:

```yaml title=".ber/bench/experiments/planner-sweep.yaml"
attempts: 3

tools:
  - tool: plan-build-review
    steps:
      plan:
        model: [opus-5, sonnet-5]
        effort: [high, max]
      build:
        model: [sonnet-5]

  - tool: claude-code
    model: [sonnet-5]
    effort: [high]
```

The workflow block has `2 × 2 × 1 × 3 = 12` cells per challenge; the control
adds 3. The omitted review step stays exactly as the workflow declares it and
does not multiply the matrix.

A workflow does not need top-level `model:` or `effort:` because it has no
model of its own. When present, those values are defaults for steps that pin
nothing. Precedence is block default, then workflow step definition, then
experiment step override. A step with no model after resolution is an error.

Step `options:` work the same way and make context manipulation a first-class
pipeline axis:

```yaml
steps:
  plan:
    options:
      context_mode: [off, on]
```

That option must exist on the plan step's underlying tool. See [Benchmark
context-reduction tools](context-tools.md) for defining treatment options and
choosing honest controls.

## Validate, preview, and run

```bash
berbench doctor
berbench experiment validate planner-sweep --verbose
berbench run planner-sweep --challenge 811 --dry-run
```

Check that verbose validation shows only the intended step combinations. Say
the cost multiplication out loud: cells per challenge × selected challenges.
After reviewing the dry run, run the same command without `--dry-run`.

## Inspect workflow results

```bash
berbench report latest
berbench report cell <cell-key>
```

The leaderboard identifies swept step choices and summarizes the pipeline.
`report cell` shows which step spent the time and tokens, each step's status and
exit code, and paths to its artifacts and handover files, followed by the final
patch and verification. A unique prefix of the printed cell key is enough.

Workflow cost is the sum of its steps. If any step's model is unpriced, the
whole cell reports unknown cost rather than presenting an incomplete total.
