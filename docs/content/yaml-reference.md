---
sidebar_label: YAML configuration
---

# YAML reference

BERBench has four core YAML files:

| File | Scope |
|---|---|
| `.ber/bench/config.yaml` | This repository |
| `.ber/bench/challenges/<id>/challenge.yaml` | One challenge |
| `.ber/bench/experiments/<name>.yaml` | One experiment |
| `~/.config/ber/bench/config.yaml` | All repositories for this user |

It also writes `~/.config/ber/bench/pricing.yaml`. Tool registry overlays live
under a `tools/` directory next to either config; they can extend a built-in
tool or define a script or workflow tool.

## Project config

`.ber/bench/config.yaml` is created by `berbench init`.

```yaml
defaults:
  attempts: 1
  concurrency: 1

dockerfile: Dockerfile.berbench

source:
  provider: github
  host: github.com
  owner: example
  repo: project
  remote: git@github.com:example/project.git

harvest:
  prompt_source: issue
  test_patterns:
    - "tests/**"
    - "**/*_test.go"

# Optional. Must be absolute or start with ~/.
results: ~/berbench-results/example-project

agent:
  allow_hosts: []
```

| Field | Meaning |
|---|---|
| `defaults.attempts` | Default repetitions for each matrix point. Minimum is 1. |
| `defaults.concurrency` | Default number of cells running at once. Minimum is 1. |
| `defaults.cell_timeout` | Wall clock for one cell's agent phase, as a Go duration. Default `20m`. Every model x effort x attempt gets it in full; it does not cap the run as a whole. A challenge's own `timeout:` overrides it. |
| `dockerfile` | Dockerfile path, relative to the repository root or absolute. |
| `source.provider` | `github` or `gitlab`. |
| `source.host` | Git host name. |
| `source.owner` | Repository owner or group. |
| `source.repo` | Repository name. |
| `source.remote` | Git remote URL used as the source. |
| `harvest.prompt_source` | `issue` (default) or `pr_description`. |
| `harvest.test_patterns` | Glob patterns that classify changed files as tests. Replaces the built-in patterns. |
| `results` | Optional results root. It must be absolute or start with `~/`; repository-relative paths are rejected. |
| `agent.allow_hosts` | Extra API hosts added to the allowlist. Code-forge hosts are rejected. Usually leave empty. There is no way to switch the allowlist off from a config file. |

Project values override global defaults. `agent.allow_hosts` is combined with
the global list.

## Global config

`~/.config/ber/bench/config.yaml` contains user-wide defaults and optional
credential hints.

```yaml
defaults:
  attempts: 1
  concurrency: 1
  cell_timeout: 20m

agent:
  allow_hosts: []

credentials:
  claude-code:
    env: CLAUDE_CODE_OAUTH_TOKEN
  codex:
    file: ~/.codex/auth.json
```

| Field | Meaning |
|---|---|
| `defaults` | Same fields as project defaults. Project values win. |
| `agent` | Same allowlist additions as project config; the two lists are combined. |
| `credentials.<tool>.env` | Preferred environment variable for a tool. |
| `credentials.<tool>.file` | Preferred credential file for a tool. |

The built-in tool definitions also know their normal credential locations, so
most users do not need a `credentials` block.

## Experiment config

Files live in `.ber/bench/experiments/`.

```yaml
id: optional-display-id
attempts: 3
concurrency: 2

tools:
  - tool: claude-code
    model: [opus-5, sonnet-5]
    effort: [medium, high]
    options:
      project_doc: [default, none]

  - tool: codex
    model: [gpt-5.6-terra]
    effort: [high]

  - tool: plan-build-review
    steps:
      plan:
        model: [opus-5, sonnet-5]
        effort: [high]
      build:
        options:
          project_doc: [default, none]
        timeout: 20m
```

| Field | Required | Meaning |
|---|---:|---|
| `id` | No | Experiment id. Defaults to the filename without `.yaml`. |
| `attempts` | No | Repetitions per matrix point. Falls back to project/global default. |
| `concurrency` | No | Cells to run at once. Falls back to project/global default. |
| `tools` | Yes | List of tool blocks. Blocks are combined as a union. |
| `tools[].tool` | Yes | Tool registry name, such as `claude-code` or `codex`. |
| `tools[].model` | Yes | One or more model keys. Always a list. |
| `tools[].effort` | Yes | One or more effort values. Always a list. |
| `tools[].options` | No | Option name to list of values. Each listed option becomes an axis. |
| `tools[].steps` | Workflow only | Step name to model, effort, option, or timeout overrides. Every list becomes an axis. |
| `tools[].steps.<name>.model` | No | Model keys for this step. Always a list when present. |
| `tools[].steps.<name>.effort` | No | Effort values for this step. Always a list when present. |
| `tools[].steps.<name>.options` | No | Option name to list of values, resolved against the step's tool. |
| `tools[].steps.<name>.timeout` | No | Scalar Go duration bounding this step inside the cell timeout. Not an axis. |

Within a tool block, all lists—including lists nested below `steps:`—form a
cross product. `attempts` multiplies the result. Run `berbench experiment
validate <name> --verbose` to see the exact cells and catch invalid values.

`model` and `effort` are normally required. A `type: workflow` tool with no
models of its own is the exception: each of its steps can receive those values
from the workflow definition or `steps:` instead. Top-level values, when
present, are fallbacks; the workflow's scalar step definition wins over them,
and experiment `steps:` values win last.

## Challenge config

Files live at `.ber/bench/challenges/<id>/challenge.yaml`. `challenge create`
writes most fields. Users normally edit only `environment`, `timeout`, `prompt`,
and `verify`.

```yaml
source:
  remote: git@github.com:example/project.git
  pull_request: https://github.com/example/project/pull/123
  issues:
    - https://github.com/example/project/issues/122
  base_commit: 0123456789abcdef

environment:
  image: example-project
  build_args:
    PYTHON_VERSION: "3.12"
  setup:
    - chown -R agent:agent /workspace

prompt:
  file: issue.md

timeout: 20m

verify:
  reward: exit_code
  network: false
  guard:
    protect: [tests/]
    apply_patch: tests.patch
  script:
    - pytest -q tests/test_bug.py

reference:
  patch: gold.patch
```

| Field | Meaning |
|---|---|
| `source.remote` | Source git remote. |
| `source.pull_request` | Merged pull request URL. Provenance only; never shown to the agent. |
| `source.issues` | Issue URLs used to build the prompt. The old singular `issue` field still loads. |
| `source.base_commit` | Exact commit the agent starts from. |
| `environment.image` | Local name for the built challenge image. |
| `environment.build_args` | Docker build arguments. |
| `environment.setup` | Commands run inside the container before the agent starts. |
| `prompt.file` | Challenge-relative Markdown file shown to the agent. Defaults to `issue.md` when empty. |
| `timeout` | Wall clock for one cell's agent phase on this challenge, as a Go duration such as `20m` or `1h`. Overrides `defaults.cell_timeout`. At the deadline the agent process is stopped (SIGTERM, then SIGKILL after 60s) and whatever it wrote so far is still verified. |
| `verify.reward` | Scoring rule. Only `exit_code` is supported. |
| `verify.network` | Whether the clean verifier gets network access. Keep `false` unless tests require it. |
| `verify.guard.protect` | Path prefixes removed from the agent patch before hidden tests are applied. |
| `verify.guard.apply_patch` | Challenge-relative hidden test patch. |
| `verify.script` | Commands run by the clean verifier, in order. Exit code decides pass or fail. |
| `reference.patch` | Challenge-relative known-fix patch. Never shown to the agent. |

BERBench also writes `harvest` and `validated` sections. `harvest` is the audit
trail for challenge creation. `validated` records the most recent proof:

```yaml
validated:
  at: 2026-08-01T10:48:30Z
  base_fail: true
  gold_pass: true
```

Do not set this by hand. Run `berbench challenge validate <id>`.

## Pricing config

`~/.config/ber/bench/pricing.yaml` stores USD prices per million tokens:

```yaml
models:
  model-api-id:
    input: 3.00
    cache_read: 0.30
    output: 15.00
```

Keys are model API ids from the tool registry, not necessarily the short model
keys used in experiment files. A missing or all-zero entry reports unknown cost
rather than a fabricated figure, and contributes nothing to a run's cost total.

This file is **merged** over the prices built into the binary, key by key, so it
only needs to name the models whose prices you want to change. Every other model
keeps its shipped price, including models added by later BERBench releases. To
suppress a shipped price rather than change it, give that model zeros.

## Tool registry overlays

Use overlays when the built-in tools are not enough or when defining a
workflow:

```text
~/.config/ber/bench/tools/<tool>.yaml       # user-wide
.ber/bench/tools/<tool>.yaml                # this repository
```

Resolution order is built-in, then global overlay, then project overlay. An
overlay can extend a built-in tool and add or replace model and option entries:

```yaml
tool: codex
extends: builtin

models:
  my-model:
    id: model-api-id
    effort: [low, medium, high]
```

`models:` and `options:` merge key by key, so an overlay only names what it adds
or replaces; an overlay key replaces the built-in entry wholesale rather than
merging its fields. `install`, `invoke`, `auth`, `network` and `artifacts` stay
built-in-owned and are rejected in an overlay.

This is the supported way to use a model BERBench has not shipped a name for
yet — the error for an unknown model prints the exact file to write. Remember to
price the new id in `pricing.yaml`, or its cells report unknown cost.

### Option values

Each value of an option may declare any of:

| Key | Effect |
|---|---|
| `args` | Appended to the tool's invocation. |
| `pre` / `post` | Shell commands run in the container around the invocation. `{workdir}` expands to the working tree. |
| `env` | Environment variables set for the agent. Static values only — anything per-user belongs in the tool's `auth.env`, which is forwarded from the host. |
| `require_env` | Host environment variables that must be set when this value is selected, mapped to the hint shown when one is missing. The cell fails before its container starts. |
| `network.allow` | Extra hosts added to the run's egress allowlist, **only** for runs that select this value. Code-forge hosts are refused here as everywhere else. |

`env` is part of a cell's fingerprint, so two cells that differ only by an
option's environment are distinct cells and never reuse each other's results.

### Model providers (Amazon Bedrock)

The built-in `claude-code` tool uses those keys to expose a `provider` option:

```yaml
tools:
  - tool: claude-code
    model: [bedrock/opus-5]
    effort: [high]
    options:
      provider: [bedrock]
```

`provider: bedrock` sets `CLAUDE_CODE_USE_BEDROCK=1`, adds the AWS hosts to the
allowlist, and requires `AWS_REGION` to be exported — Claude Code does not read
`~/.aws/config` for the region. Keys come from the environment
(`AWS_ACCESS_KEY_ID` and friends) or from `~/.aws/credentials`, which is staged
read-only into the container like any other credential file. The shipped
allowlist covers `us-east-1`; other regions need
`--allow-host bedrock-runtime.<region>.amazonaws.com`.

Bedrock model keys are separate registry entries with `anthropic.`-prefixed ids
because Bedrock is partner-operated with its own rate card. They ship unpriced,
so their cells report unknown cost until you add AWS rates to `pricing.yaml`.

For the full setup — credentials, regions, pricing, and troubleshooting — see
[Run Claude Code on Amazon Bedrock](how-to/bedrock.md).

Use `berbench doctor` and `berbench experiment validate` after changing an
overlay.

### Workflow tools

A workflow is a standalone registry tool made from ordered invocations of
other registry tools:

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
      Plan the fix without editing {workdir}.
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
      Review and fix the implementation in {workdir}.

      {prompt}
```

| Step field | Required | Meaning |
|---|---:|---|
| `name` | Yes | Stable step key used by experiment `steps:` overrides and reports. |
| `tool` | Yes | Registry tool invoked for this step. |
| `model` | No | Scalar default model. May instead come from the experiment block. |
| `effort` | No | Scalar default effort. May instead come from the experiment block. |
| `options` | No | Scalar option values for the step's tool. |
| `prompt` | No | Step prompt. Empty defaults to the challenge prompt. |
| `timeout` | No | Positive Go duration for this step, nested inside the cell's total budget. |

Prompt placeholders are `{prompt}` for the challenge prompt, `{workdir}` for
the shared working tree, and `{handover}` for `/tmp/berbench/handover`.
`BERBENCH_HANDOVER` contains the same path. Put plans and reviews in the
handover directory, not the working tree: files under the working tree become
part of the candidate patch. Workflow steps run sequentially and fail fast in
one container, then BERBench verifies the final patch once.

Each step's artifacts and newly written handover files are stored under
`cells/<key>/steps/<index>-<name>/`. See [Workflow
pipelines](how-to/workflows.md) for experiment design and reporting.

For a complete control-versus-treatment example using overlay options to
measure Caveman, RTK, and context-mode, see [Benchmark context-reduction
tools](how-to/context-tools.md).
