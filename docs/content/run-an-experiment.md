---
sidebar_label: Run your first benchmark
---

# Run an experiment end to end

This guide runs one merged pull request against Claude Code and Codex. Replace
`13964` and the model names with values available in your setup.

Running `berbench` with no arguments walks the same ground interactively, one
step at a time. This guide is the same work done by hand.

## 1. Initialize the repository

```bash
cd /path/to/your/repository
berbench init
berbench doctor
```

If `doctor` reports no Dockerfile, create `Dockerfile.berbench`, then run it
again.

## 2. Create and validate a challenge

```bash
berbench challenge create 13964
berbench challenge lint 13964
berbench challenge validate 13964
```

Between `create` and `lint`, read `.ber/bench/challenges/13964/issue.md` and
make sure it describes exactly what the hidden tests check — no more, no less.
That review is the step BERBench does not automate.

Do not continue until validation reports both `base_fail: true` and
`gold_pass: true`.

## 3. Create an experiment

```bash
berbench experiment create smoke \
  claude-code/opus-5/high \
  codex/gpt-5.6-terra/medium
```

Start with one attempt and one challenge; `attempts:` defaults to 1 and is an
edit to the file when you want more. Increase the sample only after the whole
pipeline works.

`berbench experiment create` with no arguments asks instead — name, tools,
models, effort, and the cell count before it writes anything. It needs a
terminal. `berbench experiment create full`, with a name and no specs, writes a
scaffold listing every tool, model and effort for you to delete from.

## 4. Check the plan

```bash
berbench experiment validate smoke --verbose
berbench run smoke --challenge 13964 --dry-run
```

Read the cell count and estimated plan before starting a paid run.

## 5. Run it

```bash
berbench run smoke --challenge 13964 --follow
```

By default, the agent can reach only the model API required by its tool. It
cannot reach GitHub or GitLab to fetch the original fix.

There is no way to switch the allowlist off. `--allow-host` widens it by name,
and code-forge hosts are refused there as everywhere else — an agent that can
reach one fetches the upstream fix instead of solving the challenge.

If the process stops, run the same command again. Completed cells with the same
fingerprint are reused. Use `--fresh` only when you intentionally want to rerun
all cells.

## 6. Read the results

The run sends its cells to BERBench Cloud and ends on a dashboard URL. That URL
is the report: configurations are ranked there, over every cell you have sent,
not just the ones this run measured.

If the machine was not signed in, the run still succeeded — it says so and exits
zero:

```bash
berbench login
berbench sync latest              # or `berbench sync` for the whole store
berbench sync --dry-run           # exactly what would leave the machine
```

A configuration is only comparable to another over the challenges **both** have
been measured on. Cells accumulate across runs by fingerprint, which is what
lets a matrix filled in over several partial runs read as one ranking.

`berbench runs` lists what this machine holds. The data behind the dashboard is
on disk too:

```bash
jq '.summary' <run>/report.json
jq '.cells[] | {key, status, turns, tool_calls}' <run>/report.json
jq '.steps' <results>/cells/<key>/cell.json   # per-step detail for a workflow
```

Results are stored by fingerprint, once, in `cells/<key>/` under the results
directory; a run records the keys it touched rather than a copy of them.

:::warning Store layout changed

Results written before this layout are unreachable — the fingerprint recipe
changed with it, so the old keys cannot be matched. `berbench` refuses to open
such a store and prints the directory to remove. There is nothing to migrate:

```bash
rm -rf ~/.local/share/berbench/<repo-id>
```

:::

## 7. Expand carefully

After the smoke run succeeds:

1. Raise `attempts` to reduce luck in the result.
2. Add more validated challenges.
3. Add one model, effort, or option axis at a time.
4. Re-run `experiment validate` and `run --dry-run` after each edit.

The total work is:

```text
matrix cells per challenge × validated challenges
```

That number also controls most of the time and cost.
