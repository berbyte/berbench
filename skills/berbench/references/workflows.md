# Workflows and context manipulation

A workflow is a registry tool containing ordered agent steps. Use one to test
plan → build → review, strong-planner/cheap-builder, mixed-tool review, or a
context manipulation applied to only one phase.

## Define it

Write `.ber/bench/tools/<name>.yaml` for a project workflow, or
`~/.config/ber/bench/tools/<name>.yaml` for a user-wide one:

```yaml
tool: plan-build-review
type: workflow
steps:
  - name: plan
    tool: claude-code
    model: opus-5
    effort: high
    timeout: 10m
    prompt: |
      Do not edit {workdir}. Write a plan to {handover}/plan.md.

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
    prompt: |
      Review and fix the change in {workdir}.

      {prompt}
```

Rules:

- Steps run sequentially and fail fast in one container and working tree. The
  final patch is verified once.
- Every step names a registered tool. Its model, effort and scalar `options:`
  are checked against that tool. All underlying tools need credentials.
- The cell allowlist combines only the API hosts needed by its resolved steps
  and selected options. All installable CLIs may be on `PATH`, but an unrelated
  one has neither credentials nor egress.
- `{prompt}` is the challenge, `{workdir}` is the graded tree, and `{handover}`
  is `/tmp/berbench/handover`. Write plans and reviews to `{handover}` so they
  do not enter the candidate patch.
- A step `timeout:` is inside, and never extends, the cell timeout.

## Make steps axes

```yaml
attempts: 3
tools:
  - tool: plan-build-review
    steps:
      plan:
        model: [opus-5, sonnet-5]
        effort: [high, max]
        options:
          context_mode: [off, on]
      build:
        model: [sonnet-5]

  # The builder working alone is the control for whether planning helps.
  - tool: claude-code
    model: [sonnet-5]
    effort: [high]
```

Every list under `steps:` joins the block's cross product. Here the workflow is
`2 planner models × 2 efforts × 2 context values × 1 builder × 3 attempts = 24`
cells per challenge. An omitted step or field stays pinned and is not an axis.
`timeout:` is scalar and does not multiply cells.

A workflow needs no top-level `model:` or `effort:` when its steps supply them.
If present, block values are fallbacks. Precedence, weakest to strongest:

```text
block model/effort → registry step scalar → experiment steps list
```

For context tools, define `off`/`on` options on the underlying CLI overlay as
described in the documentation's context-tools guide. Isolate one treatment per
arm unless the user explicitly wants interaction effects. `args:` are
invocation-local, but step option environments are shared and state written by
`pre` can persist into later steps. Flag treatments that are not truly
step-local and globally conflicting setup hooks.

## Controls and execution

- Include the builder alone to test whether the workflow beats its component.
- Use separate blocks for intentional pairs; putting several planners and
  builders in one block creates their full cross product.
- Run `berbench experiment validate <name> --verbose`, inspect every resolved
  label, then `berbench run <name> --dry-run`.
- State `cells × challenges = paid agent runs` and obtain explicit approval
  before the real run, as required by `SKILL.md`.

## Read it

`berbench report latest` compares configurations. `berbench report cell <key>`
shows each workflow step's tool/model/effort, status, duration, tokens, cost,
exit code, declared artifacts and handover files. A unique key prefix works.
Workflow cost is the sum of its steps; one unpriced step makes the cell's cost
unknown.
