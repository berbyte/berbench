---
sidebar_label: Run your first benchmark
---

# Run an experiment end to end

This guide runs one merged pull request against Claude Code and Codex. Replace
`13964` and the model names with values available in your setup.

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
berbench challenge edit 13964 --file prompt
berbench challenge lint 13964
berbench challenge validate 13964
```

Do not continue until validation reports both `base_fail: true` and
`gold_pass: true`.

## 3. Create an experiment

```bash
berbench experiment create smoke \
  claude-code/opus-5/high \
  codex/gpt-5.6-terra/medium \
  --attempts 1
```

Start with one attempt and one challenge. Increase the sample only after the
whole pipeline works.

To see everything available instead, run `berbench experiment create full` with
no specs: it writes a scaffold listing every tool, model and effort, for you to
delete from.

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

## 6. Read the report

```bash
berbench report smoke
berbench report latest
berbench report list
berbench report smoke --json
```

Naming the experiment reports on **every cell the store holds** for it, however
many runs produced them, so a matrix filled in over several partial runs still
ranks as one leaderboard. Cells that have never been measured are named, with
the command that fills them in. Naming a run id (or `latest`) audits that one
execution instead.

A configuration is only ranked against another over the challenges **both** have
been measured on. A challenge some configurations are missing is listed under
the table rather than folded into the ranking — a 2/2 pass rate and a 1/1 are
not comparable, and a leaderboard that ranks them against each other says they
are. Narrow with `--challenge` to rank over one of them.

The terminal report gives the leaderboard. The JSON command writes the report
artifacts and prints the path to `report.json`.

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
