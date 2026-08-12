# Experiments

An experiment says which configurations to compare. It does **not** select
challenges — a run uses every validated challenge unless `--challenge` narrows
it.

## Intent to matrix

```bash
berbench experiment create smoke \
  claude-code/opus-5/high \
  codex/gpt-5.6-terra/medium
```

writes `.ber/bench/experiments/smoke.yaml`:

```yaml
tools:
  - tool: claude-code
    model: [opus-5]
    effort: [high]

  - tool: codex
    model: [gpt-5.6-terra]
    effort: [medium]
```

With only a name, `create <name>` writes a full scaffold of every tool, model
and effort in the registry, one per line, for the user to delete from. Models
with no price in `pricing.yaml` are partner-operated and arrive commented out.

### Rules that are hard errors

- Every tool block needs **both** `model:` and `effort:`, and both must be
  **lists** — even for a single pinned value. A model-less `type: workflow`
  tool is the exception; its steps supply those values.
- `effort:` is shared by every model in its block, so **every model in a block
  must accept every effort listed there**. Models with different effort sets go
  in separate blocks; blocks union, so the resulting matrix is the same.
- Unknown tool, model, effort or option values are rejected, not ignored.
- Empty strings in `model:` or `effort:` are errors.

### Shape

- Blocks are **added**. Lists inside one block **cross-product**. `attempts`
  multiplies everything.
- **Only list an option when you mean it as an axis.** An unlisted option sits
  at the tool registry's default; listing it with one value is the same matrix
  but a noisier file.

```yaml
attempts: 3

tools:
  - tool: claude-code
    model: [opus-5, sonnet-5]
    effort: [medium, high]
    options:
      project_doc: [default, none]
```

= `2 models x 2 efforts x 2 option values x 3 attempts` = 24 cells per challenge.

## Cost math, out loud, before spending

Always state this before proposing a run:

```
cells   = Σ over blocks ( models × efforts × option values ) × attempts
runs    = cells × validated challenges
```

For workflow blocks, multiply every listed step model, effort, and option axis
too. Step fields omitted from the experiment stay pinned and do not multiply
the matrix. Read `references/workflows.md` before creating or modifying one.

Say the numbers. "24 cells x 6 validated challenges = 144 agent runs" is the
sentence the user needs to approve or cut down. Unpriced models report unknown
cost, so a dry run's dollar figure can be a floor rather than a total — say so
when it applies.

## Order of operations

```bash
berbench experiment validate smoke --verbose   # syntax + every resolved cell
berbench run smoke --dry-run                   # the plan, spends nothing
# → show the user the plan and the cell count, then WAIT for approval
berbench run smoke --follow                    # only after an explicit yes
```

`--dry-run` before `run` is not optional. See the hard rules in `SKILL.md`.

Run flags worth knowing:

| Flag | Effect |
|---|---|
| `--challenge a,b` | restrict to these challenge ids |
| `--concurrency N` | worker pool size, overrides experiment and config |
| `--follow` | stream live progress |
| `--fresh` | ignore fingerprint reuse, re-run every cell |
| `--include-unvalidated` | run challenges with no passing `validated:` block — results are not evidence; only for debugging |
| `--verbose-build` | stream image build output |
| `--egress` / `--allow-host` | egress policy; a forge host is a hard error |

## Reruns are cheap

Completed cells are reused by fingerprint: an identical cell (same challenge,
prompt text, tool, model, effort, options) is not paid for twice. An interrupted
run should simply be re-run — it picks up where it stopped. Only reach for
`--fresh` when the user actually means "spend again to re-measure", e.g. to
sample variance. Editing `issue.md` changes the fingerprint, so a prompt fix
correctly invalidates the old cells.

## Reading results

```bash
berbench report latest
berbench report latest --json     # for parsing
berbench report list              # stored runs, newest first
berbench report cell <key>        # one cell; includes workflow step details
```

Per-cell outcomes:

- **pass** — the hidden tests passed after the agent's patch.
- **fail** — the agent finished, the tests did not pass. A real measurement.
- **error** — the cell did not produce a measurement: crash, timeout, missing
  credential, unreachable API. Do not read these as "the model failed".
- **reused** — served from a previous run by fingerprint, not re-billed.

Ranking is lexicographic: **pass rate, then cost, then tokens, then lines
changed, then time**. Only complete configurations rank; a configuration with
unpriced cells has a cost floor, not a total, and is treated accordingly.

## Unknown model

The error prints the known models for that tool and the exact overlay file to
write. Registry overlays live at:

```text
~/.config/ber/bench/tools/<tool>.yaml     # user-wide
.ber/bench/tools/<tool>.yaml              # this repository
```

Resolution is built-in, then global overlay, then project overlay; `models:` and
`options:` merge key by key. See `docs/content/yaml-reference.md` for the schema
before writing one.
