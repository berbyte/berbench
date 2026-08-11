---
slug: /
sidebar_label: Overview
---

# berbench

**Which AI coding tool is actually best on _your_ codebase?**

berbench answers that with evidence instead of vibes. It turns merged pull
requests from your repository into reproducible bug-fixing tasks, runs coding
agents against them in isolated containers, and ranks the results.

## The idea in three steps

1. **Harvest** — pick a merged pull request. berbench splits it into an issue,
   a starting commit, hidden tests, and the known fix.
2. **Validate** — prove the task is real: the hidden tests must fail before the
   fix and pass after it.
3. **Compare** — run tool, model, and effort combinations against the task and
   rank them by pass rate, cost, tokens, patch size, and time.

The agent gets the issue and the pre-fix code. It never sees the pull request,
the hidden tests, or the reference fix — and by default it cannot reach GitHub
or GitLab to look them up.

## The whole workflow

```bash
berbench init                       # set up this repository
berbench doctor                     # check Docker, credentials, config

berbench challenge create 13964     # harvest a merged PR
berbench challenge validate 13964   # prove it fails before, passes after

berbench experiment create smoke \
  claude-code/opus-5/high \
  codex/gpt-5.6-terra/medium        # define what to compare

berbench run smoke --dry-run        # preview, spend nothing
berbench run smoke                  # run it
berbench report latest              # leaderboard
```

## Two things to know

**A challenge is a task.** One harvested pull request, validated. Challenges
live in your repository under `.ber/bench/` and are worth committing.

**An experiment is a matrix.** Tools × models × efforts × options × attempts.
It says *what to compare*, not *what to solve* — a run uses every validated
challenge unless you narrow it with `--challenge`.

One challenge × one matrix cell = one result. That multiplication is also your
time and cost.

## What's supported

| | |
|---|---|
| **Repositories** | GitHub, GitLab |
| **Coding tools** | Claude Code, Codex |
| **Model providers** | Anthropic and OpenAI APIs, [Amazon Bedrock](how-to/bedrock.md) |
| **Execution** | Docker, with agent network access restricted to the model API |

## Where to go next

| If you want to… | Read |
|---|---|
| Install berbench and set up a repository | [Getting started](getting-started.md) |
| Follow the full workflow once, end to end | [Run your first benchmark](run-an-experiment.md) |
| Build a challenge you can trust | [Challenges](challenges.md) |
| Design a fair comparison | [Experiments](experiments.md) |
| Run Claude Code against Bedrock | [How-to: Amazon Bedrock](how-to/bedrock.md) |
| Have a coding agent drive berbench for you | [Agent skill](skill.md) |
| Look up a config field | [YAML reference](yaml-reference.md) |
