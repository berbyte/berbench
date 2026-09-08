---
sidebar_label: YAML reference
---

# YAML reference

BERBench configuration is strict and versioned. Unknown fields, duplicate
keys, unsupported versions, and a `kind` in the wrong location are errors.
Matching JSON Schemas are installed with the CLI.

## File layout and precedence

```text
.ber/bench/
├── config.yaml
├── tasks/<id>/task.yaml
├── evaluations/<name>.yaml
└── tools/<name>.yaml

~/.config/ber/bench/
├── config.yaml
├── credentials.yaml
├── pricing.yaml
└── tools/<name>.yaml
```

All YAML documents begin with:

```yaml
apiVersion: bench.ber.run/v1alpha1
kind: <document kind>
```

Project configuration overrides user defaults. Tool resolution is built-in,
then user overlay, then project overlay. Credentials and result files are not
project configuration and must not be committed.

## Project

Location: `.ber/bench/config.yaml`

```yaml
apiVersion: bench.ber.run/v1alpha1
kind: Project

defaults:
  attempts: 1
  concurrency: 1
  cell_timeout: 20m
  resources:
    cpus: 2
    memory: 4GiB
    pids: 512

source:
  provider: github
  host: github.com
  owner: example
  repo: project
  remote: git@github.com:example/project.git

dockerfile: Dockerfile.berbench

harvest:
  prompt_source: issue
  test_patterns: ["tests/**", "**/*_test.go"]
  noise_patterns: ["CHANGELOG.md"]

agent:
  allow_hosts: []
```

| Field | Meaning |
| --- | --- |
| `defaults.attempts` | Default repetitions for each matrix setup. |
| `defaults.concurrency` | Maximum cells running at once. |
| `defaults.cell_timeout` | Wall-clock limit for one agent phase, as a Go duration. |
| `defaults.resources` | Docker CPU, memory, and PID limits for a cell. |
| `source` | Canonical GitHub or GitLab repository identity and remote. |
| `dockerfile` | Path inside the repository, relative to its root. |
| `results` | Optional absolute or `~/`-relative results root. It must be outside the repository. |
| `harvest.prompt_source` | `issue`, `pull_request`, or `auto`. |
| `harvest.test_patterns` | Glob patterns used to split hidden tests from the reference patch. |
| `harvest.noise_patterns` | Changed paths omitted from both sides of the harvested solution. |
| `agent.allow_hosts` | Additional agent egress hosts. Code-forge hosts are always rejected. |

## UserConfig

Location: `~/.config/ber/bench/config.yaml`

```yaml
apiVersion: bench.ber.run/v1alpha1
kind: UserConfig

defaults:
  concurrency: 3

credentials:
  claude-code:
    file: ~/.claude/.credentials.json
```

User defaults apply across repositories. Credential hints select an environment
variable or file already supported by a tool definition; they do not contain
the secret itself.

## Task

Location: `.ber/bench/tasks/<id>/task.yaml`

```yaml
apiVersion: bench.ber.run/v1alpha1
kind: Task

source:
  remote: https://github.com/example/project.git
  pull_request: https://github.com/example/project/pull/42
  base_commit: "1111111111111111111111111111111111111111"
  fix_commit: "2222222222222222222222222222222222222222"

prompt: prompt.md

verify:
  network: false
  protected_paths: [tests/]
  tests_patch: tests.patch
  setup: []
  command: pytest -q tests/test_bug.py

reference_patch: reference.patch
```

`verify.allow_hosts` may narrow explicit verifier network access when
`verify.network` is enabled. Keep verification offline unless the test itself
requires a service.

`task validate` owns the optional `validation` block:

```yaml
validation:
  at: 2026-08-01T10:48:30Z
  fingerprint: <input fingerprint>
  base_failed: true
  reference_passed: true
```

Never write it by hand. It is evidence that BERBench executed both validation
phases over the fingerprinted inputs.

## Evaluation

Location: `.ber/bench/evaluations/<name>.yaml`

```yaml
apiVersion: bench.ber.run/v1alpha1
kind: Evaluation
attempts: 3

tools:
  - tool: claude-code
    tool_version: latest
    model: [sonnet-5, opus-5]
    effort: [medium, high]
    options:
      max_turns: [50, 100]

  - tool: plan-build
    steps:
      plan:
        model: [opus-5]
        effort: [medium, high]
      build:
        model: sonnet-5
        effort: medium
```

| Field | Meaning |
| --- | --- |
| `attempts` | Repetitions of every resolved setup. |
| `tools` | Tool blocks combined as a union. |
| `tool` | Built-in, overlaid, or workflow tool name. |
| `tool_version` | One version or a list of version axes. |
| `model`, `effort` | Scalar or list; lists form axes. |
| `options` | Tool option name to scalar or list of values. |
| `pre` | Commands that prepare an intentional setup before the agent runs. |
| `steps` | Per-step model, effort, and option axes for a workflow. |

All lists inside one block form a cross product. A scalar and a one-item list
are equivalent. A workflow may omit top-level model and effort when its steps
resolve them.

## Pricing

Location: `~/.config/ber/bench/pricing.yaml`

```yaml
apiVersion: bench.ber.run/v1alpha1
kind: Pricing

models:
  model-api-id:
    input: 3.00
    cache_read: 0.30
    cache_write: 3.75
    output: 15.00
```

Rates are USD per million tokens and are keyed by resolved model API ID, not
necessarily the evaluation alias. Pricing resolution is tool-reported cost,
then this user table, then the table embedded in the CLI, then unknown. User
entries merge over built-ins per model and rate. If any required rate is
missing, the cell cost is `null`, never a partial or zero estimate.

## Tool overlay

Locations:

```text
~/.config/ber/bench/tools/<tool>.yaml
.ber/bench/tools/<tool>.yaml
```

Add a model to a built-in tool:

```yaml
apiVersion: bench.ber.run/v1alpha1
kind: Tool
tool: codex
extends: builtin

models:
  my-model:
    id: model-api-id
    effort: [low, medium, high]
```

Or add an enumerated option:

```yaml
apiVersion: bench.ber.run/v1alpha1
kind: Tool
tool: claude-code
extends: builtin

options:
  plugin:
    default: "off"
    values:
      "off": {}
      "on":
        args: [--plugin-dir, /opt/my-plugin]
```

Model and option entries replace the same key from the lower-precedence layer.
Project and user overlays may extend public axes but cannot replace the
built-in installation, invocation, authentication, network, or artifact
boundary.

## Workflow

A workflow is a registry tool with ordered steps:

```yaml
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
      Plan a fix without editing {workdir}.
      Write the plan to {handover}/plan.md.

      {prompt}

  - name: build
    tool: codex
    model: gpt-5.6-terra
    effort: medium
    prompt: |
      Implement {handover}/plan.md in {workdir}.

      {prompt}
```

`{prompt}`, `{workdir}`, and `{handover}` are the supported placeholders.
Steps run sequentially and fail fast. See [Workflow pipelines](how-to/workflows.md).
