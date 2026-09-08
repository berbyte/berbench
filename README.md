# BERBench

**SWE-bench for your own repository.**

BERBench turns merged pull requests into reproducible coding tasks, runs AI
coding tools against them in isolated Docker containers, and records which
tool, model, effort, options, or workflow works best on your codebase.

[Documentation](https://rtfm.berbench.com) ·
[Getting started](https://rtfm.berbench.com/getting-started) ·
[Releases](https://github.com/berbyte/berbench/releases) ·
[Website](https://berbench.com)

## Why benchmark your own work?

Public benchmarks cannot represent your architecture, tests, conventions, or
typical maintenance work. Comparing agents on live tasks is not controlled:
each task is different, the expected answer is unknown, and an agent may be
able to find the finished change online.

BERBench uses work your team has already completed as ground truth:

1. A **task** starts from a merged pull request. The issue becomes the prompt,
   the commit before the fix becomes the starting tree, test changes become the
   hidden verifier, and the implementation changes become the reference patch.
2. **Validation** proves that the hidden tests fail before the known fix and
   pass after it.
3. An **evaluation** defines a matrix of tools, models, effort levels, options,
   workflow steps, and repeated attempts.
4. A **run** executes each selected setup against each validated task and
   records correctness, cost, tokens, patch size, and elapsed time.

The agent sees only the task prompt and pre-fix code. It never receives the
hidden tests, reference patch, Git history, or upstream pull request. Agent
network access is restricted to the selected model API.

## Install

BERBench supports Linux and macOS on amd64 and arm64. You need Git and a running
Docker daemon.

```bash
curl -fsSL https://get.berbench.com/install | bash
```

The installer selects the release for your platform and installs `berbench` in
`~/.local/bin`, `~/bin`, or another writable directory already on `PATH`. Set
`BERBENCH_BIN_DIR` to choose a directory or `BERBENCH_VERSION` to pin a release.

## Quick start

Run these commands inside the repository you want to benchmark:

```bash
berbench init
# Write Dockerfile.berbench, then:
berbench doctor

berbench task scan --json
berbench task create <pull-request>
# Review .ber/bench/tasks/<id>/, then:
berbench task validate <id>

berbench evaluation create smoke
# Edit .ber/bench/evaluations/smoke.yaml, then:
berbench evaluation validate smoke

berbench run smoke --task <id> --dry-run
berbench run smoke --task <id>
```

Always inspect the dry run. The evaluation setups multiplied by the selected
validated tasks is the number of paid agent cells. Outside an interactive
terminal, add `--yes` to an approved real run.

Commit `.ber/bench/`: it contains the project, task, evaluation, and tool
definitions that make the benchmark reviewable. Results are stored outside the
repository and should not be committed.

## What you can compare

- Claude Code, Codex, and GitHub Copilot
- Models and supported reasoning-effort levels
- Tool versions and tool-specific options
- Repository instructions, plugins, and context-reduction tools
- Ordered workflows such as plan → build or plan → build → review
- First-party Claude Code and Claude Code through Amazon Bedrock

Every workflow step runs in the same container and working tree. Steps may use
different tools and models, while handover files stay outside the graded patch.

## Documentation

| Goal | Guide |
| --- | --- |
| Understand BERBench | [Overview](https://rtfm.berbench.com) |
| Install and prepare a repository | [Getting started](https://rtfm.berbench.com/getting-started) |
| Run one benchmark end to end | [Run your first evaluation](https://rtfm.berbench.com/run-an-experiment) |
| Create trustworthy tasks | [Tasks](https://rtfm.berbench.com/challenges) |
| Design a fair matrix | [Evaluations](https://rtfm.berbench.com/experiments) |
| Configure YAML | [YAML reference](https://rtfm.berbench.com/yaml-reference) |
| Compare multi-agent workflows | [Workflow pipelines](https://rtfm.berbench.com/how-to/workflows) |
| Use Amazon Bedrock | [Amazon Bedrock](https://rtfm.berbench.com/how-to/bedrock) |
| Guide a coding agent with the bundled skill | [Agent skill](https://rtfm.berbench.com/skill) |

## This repository

This repository contains the release installer, documentation site, and the
BERBench agent skill. The CLI is distributed as prebuilt binaries from GitHub
Releases; its implementation is maintained separately.
