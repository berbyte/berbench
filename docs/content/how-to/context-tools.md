---
sidebar_label: Context tools
---

# Benchmark context-reduction tools

Tool registry overlays are not limited to adding models. They can turn an
agent-side setup into an experiment option, which is useful for measuring tools
such as Caveman, RTK, or context-mode against an unmodified agent.

This answers questions such as:

- Does reducing tool output or conversation context improve pass rate?
- Does it reduce tokens or cost without hurting solution quality?
- Does the same setup behave differently in Claude Code and Codex?

The fair comparison is a control cell and one treatment cell with the same
challenge, model, effort, timeout, and container image. Install pinned versions
of every setup in `Dockerfile.berbench`, but leave them inactive. The overlay
then activates a setup only for cells that select its option. This avoids image
contents, dependency versions, and network availability becoming confounders.

## Define treatment options

Add project overlays for the coding tools you want to test. For Claude Code,
`.ber/bench/tools/claude-code.yaml` could contain:

```yaml
tool: claude-code
extends: builtin

options:
  caveman:
    default: off
    values:
      off: {}
      on:
        args: ["--plugin-dir", "/opt/berbench-setups/caveman"]

  context_mode:
    default: off
    values:
      off: {}
      on:
        args: ["--plugin-dir", "/opt/berbench-setups/context-mode"]

  rtk:
    default: off
    values:
      off: {}
      on:
        pre:
          - "rtk init -g --auto-patch --trust-filters"
```

The plugin directories and `rtk` binary must already exist in the challenge
image at those paths. Pin their versions when building the image; do not fetch
the latest release in a cell. `off` is the default so ordinary experiments
continue to use the built-in tool unchanged.

For Codex, plugins are activated through setup commands rather than Claude
Code's `--plugin-dir` argument:

```yaml
tool: codex
extends: builtin

options:
  caveman:
    default: off
    values:
      off: {}
      on:
        pre:
          - "codex plugin marketplace add /opt/berbench-setups/caveman"
          - "codex plugin add caveman@caveman"

  context_mode:
    default: off
    values:
      off: {}
      on:
        pre:
          - "codex plugin marketplace add /opt/berbench-setups/context-mode"
          - "codex plugin add context-mode@context-mode"

  rtk:
    default: off
    values:
      off: {}
      on:
        pre:
          - "rtk init --codex -g --trust-filters"
```

`pre` runs while BERBench prepares the agent environment. Files it creates in
the working tree are included in the pre-agent baseline, so they do not count
as the agent's solution. Prefer writing plugin state outside the working tree
when the tool supports it.

:::caution RTK is not the same treatment across tools

RTK's Claude Code setup installs a `PreToolUse` hook that automatically rewrites
Bash commands. Its Codex setup is advisory: it adds instructions and the model
must choose to invoke RTK. Report these as separate treatments, not as one
tool-independent RTK result.

:::

## Build a control-versus-treatment experiment

Use separate tool blocks for the control and each treatment:

```yaml title=".ber/bench/experiments/context-tools.yaml"
attempts: 3

tools:
  - tool: claude-code
    model: [sonnet-5]
    effort: [medium]
    options:
      user_settings: [all]

  - tool: claude-code
    model: [sonnet-5]
    effort: [medium]
    options:
      user_settings: [all]
      caveman: [on]

  - tool: claude-code
    model: [sonnet-5]
    effort: [medium]
    options:
      user_settings: [all]
      rtk: [on]

  - tool: claude-code
    model: [sonnet-5]
    effort: [medium]
    options:
      user_settings: [all]
      context_mode: [on]
```

This produces four configurations: plain Claude Code and three isolated
treatments. Putting `[off, on]` on all three options in one block would instead
produce the full `2 x 2 x 2` cross product, including combinations of tools.
That is useful for interaction testing, but it does not answer the simpler
control-versus-one-treatment question.

The RTK hook above modifies user-scoped Claude settings, so this example selects
the built-in `user_settings: all` option for every arm, including the control.
Without it, BERBench's default project-only settings mode would ignore the hook.

Repeat equivalent blocks for Codex if you want to compare its treatments. Keep
the Claude Code and Codex results distinct when activation semantics differ.

## Validate the setup

First make sure the image contains every binary and plugin path referenced by
the overlays. Then validate the registry and expanded matrix without running
paid cells:

```bash
berbench doctor
berbench experiment validate context-tools --verbose
berbench run context-tools --dry-run
```

Inspect the verbose output for exactly one control and the intended treatment
arms. Check the dry-run cell count before starting the run. See [Tool registry
overlays](../yaml-reference.md#tool-registry-overlays) for the complete option
schema.
