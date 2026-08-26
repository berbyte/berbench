---
name: berbench
description: Benchmark AI coding tools on your own codebase with BERBench — SWE-bench for your own repo. Use when working in a repo with .ber/bench/ or challenge.yaml, when turning a merged pull request into a challenge (harvest a PR, `berbench challenge create/lint/validate`), when writing Dockerfile.berbench or fixing `berbench doctor`, when designing an experiment matrix of tool x model x effort, or when running `berbench run` and sending the results with `berbench sync`.
---

# BERBench

BERBench turns already-merged pull requests into coding challenges and runs
matrices of AI coding configurations against them in Docker.

## The model

- **Challenge** = one merged PR, validated. The agent sees `issue.md` (the
  prompt) and the code at `base_commit`. It never sees `tests.patch`,
  `gold.patch`, or the upstream PR.
- **Experiment** = a matrix: tool x model x effort x options, times `attempts`.
  Tool blocks union; lists inside one block cross-product.
- **A run** pairs every validated challenge with every cell of the matrix.
  `cells x validated challenges` = total agent runs. **That multiplication is
  the bill.**

## Route

Read the one reference that matches the task. Do not read all of them.

| User wants | Read |
|---|---|
| first-time setup, a Dockerfile, `doctor` is failing | `references/setup.md` |
| find, create, review, lint or validate a challenge | `references/challenges.md` |
| design a normal comparison, plan a run, read results | `references/experiments.md` |
| define or compare a workflow; sweep a pipeline step or context manipulation | `references/workflows.md` |
| any BERBench command failed | `references/troubleshooting.md` |

## Hard rules

These are not style preferences. Each one either costs real money or silently
invalidates results.

1. **Never run `berbench run` without approval.** It bills real API usage.
   Always run `berbench run <name> --dry-run` first, show the user the plan and
   the cell count, and wait for an explicit yes.

2. **Never run an interactive BERBench command.** `berbench` with no arguments
   is the setup wizard, and `berbench experiment create` with no arguments is a
   picker; both open a full-screen form and both refuse to start without a
   terminal, so in a session with one they would hang. Always pass arguments,
   and edit files directly:
   - `.ber/bench/challenges/<id>/challenge.yaml`
   - `.ber/bench/challenges/<id>/issue.md`
   - `.ber/bench/challenges/<id>/tests.patch`
   - `.ber/bench/challenges/<id>/gold.patch`
   - `.ber/bench/experiments/<name>.yaml`

   (`berbench challenge edit` and `berbench experiment edit` no longer exist.
   They opened `$EDITOR`, which is why.)

3. **Keep workflow handover files outside the working tree.** Use
   `{handover}` / `$BERBENCH_HANDOVER` for plans and reviews. Files written in
   `{workdir}` become part of the candidate patch and are graded.

4. **Never hand-write the `validated:` block** in `challenge.yaml`. Only
   `berbench challenge validate` may write it. A hand-written one is a lie about
   an experiment that never ran.

5. **Never add a code-forge host** (`github.com`, `gitlab.com`,
   `githubusercontent.com`, `bitbucket.org`, `codeberg.org`, `sr.ht`, or a
   subdomain) to `agent.allow_hosts` or `--allow-host`. BERBench rejects it by
   design and there is no override: an agent that can reach a forge fetches the
   upstream diff instead of solving the task.

6. **Never put the answer's location in `issue.md`** — no PR URL, no
   `owner/repo`, no forge URL, no `#<this challenge's id>`, no commit hash.
   `berbench challenge lint` enforces this.

7. **Commit `.ber/bench/`.** Never commit results — they live outside the repo
   by design, and `doctor` fails if the results directory is inside it.

## Order of operations

```bash
berbench init                       # once per repo
berbench doctor                     # read its output as the checklist
berbench challenge scan --json      # find candidates
berbench challenge create <pr>      # harvest — then STOP and review
berbench challenge lint <id>        # prompt must not leak
berbench challenge validate <id>    # proves base_fail + gold_pass
berbench experiment create <name> <tool>/<model>/<effort>…
berbench experiment validate <name> --verbose
berbench run <name> --dry-run       # show the user, then ask
berbench run <name> --follow        # only after approval
```

`run` sends the results to BERBench Cloud on its own and ends on a dashboard
URL — that URL is the report. Hand it to the user. If the machine is not signed
in, `run` says so and exits zero; `berbench sync latest` finishes the job once
`berbench login` has been done.

A challenge that is not `base_fail: true` **and** `gold_pass: true` is silently
skipped by runs. Never move on from an unvalidated challenge.
