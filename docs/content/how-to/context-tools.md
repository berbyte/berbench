---
sidebar_label: Context and plugins
---

# Benchmark context and plugin treatments

Tool overlays can expose a repository instruction mode, plugin, or context
reduction setup as an evaluation option. The reliable design is a control arm
and one treatment arm with the same task, image, tool version, model, effort,
timeout, and attempt count.

## Define a treatment

For a Claude Code plugin already present in the project image:

```yaml title=".ber/bench/tools/claude-code.yaml"
apiVersion: bench.ber.run/v1alpha1
kind: Tool
tool: claude-code
extends: builtin

options:
  my_plugin:
    default: "off"
    values:
      "off": {}
      "on":
        args: [--plugin-dir, /opt/berbench-setups/my-plugin]
```

Pin and install the plugin while building `Dockerfile.berbench`. A cell should
not fetch “latest”: network state and moving dependencies would become
unrecorded experimental inputs.

An option may instead run a `pre` command:

```yaml
options:
  my_context_setup:
    default: "off"
    values:
      "off": {}
      "on":
        pre:
          - my-context-tool init --non-interactive
```

The command and safely captured filesystem effects become part of cell identity.
If effects escape the supported capture boundary, the result is not reusable.

## Create control and treatment arms

```yaml title=".ber/bench/evaluations/context.yaml"
apiVersion: bench.ber.run/v1alpha1
kind: Evaluation
attempts: 3

tools:
  - tool: claude-code
    model: sonnet-5
    effort: medium
    options:
      my_plugin: "off"

  - tool: claude-code
    model: sonnet-5
    effort: medium
    options:
      my_plugin: "on"
```

Separate blocks make the intended arms obvious. Writing several `[off, on]`
axes in one block creates their full cross product, including combined
treatments. Use that only when interactions are the question.

Built-in instruction controls are tool-specific. For example, Claude Code and
Codex expose `agents_md`; Claude Code also exposes `user_settings`, while
Copilot exposes `custom_instructions`. Do not present differently activated
features as the same treatment merely because they share a label.

## Validate the design

```bash
berbench doctor
berbench evaluation validate context
berbench run context --dry-run
```

Check that the matrix contains one control and only the intended treatments.
Inspect the dry-run count before approving paid execution.

For a pipeline treatment, add the option under the selected step in the
evaluation. Remember that workflow steps share a container: state installed by
a setup hook may affect later steps even when the option was selected for only
one step. Describe it as step-local only when its effects truly are local.
