---
slug: /
sidebar_label: Overview
---

# BERBench

**Find the AI coding setup that works best on your codebase.**

BERBench turns merged pull requests from your repository into reproducible
tasks, runs coding tools against them in isolated containers, and records the
results. It gives you evidence about tool, model, effort, configuration, and
workflow choices on the software your team actually maintains.

## The model

**A task is one old change to solve again.** BERBench takes the problem from an
issue, starts from the commit before its fix, keeps the changed tests hidden,
and retains the implementation as a reference patch.

**An evaluation is a comparison matrix.** It selects tools, tool versions,
models, efforts, options, workflow steps, and attempts. Lists within one tool
block form a cross product; tool blocks are added together.

**A run is the measurement.** It pairs every resolved evaluation setup with
every selected, validated task:

```text
evaluation setups × validated tasks = paid cells
```

Each cell begins from the same task input in Docker. The candidate patch is
captured, protected paths are removed, and a fresh verifier container applies
the hidden tests. Only the hidden verifier decides correctness.

## Why the result is meaningful

- The agent never sees the hidden tests, reference patch, Git history, or
  upstream answer location.
- Agent network access is restricted to the model API and explicitly approved
  hosts. Code-forge hosts cannot be allowed during the agent phase.
- Validation proves the hidden tests fail at the base commit and pass with the
  reference patch before a task may run.
- Complete cell inputs are content-addressed. An identical completed verdict
  can be reused; a changed prompt, image, tool, option, or policy creates a new
  identity.
- Harness failures remain distinct from failed solutions.

## The shortest complete workflow

```bash
berbench init
# Write Dockerfile.berbench.
berbench doctor

berbench task scan --json
berbench task create 13964
# Review the generated task before validating it.
berbench task validate 13964

berbench evaluation create smoke
# Edit .ber/bench/evaluations/smoke.yaml.
berbench evaluation validate smoke

berbench run smoke --task 13964 --dry-run
berbench run smoke --task 13964
```

Running `berbench` without arguments is safe: it prints the current local
status, explains evaluations, tasks, and runs, and recommends the next command.
It does not change files.

## Supported surface

| Area | Support |
| --- | --- |
| Repositories | GitHub and GitLab |
| Coding tools | Claude Code, Codex, and GitHub Copilot |
| Providers | Anthropic, OpenAI, GitHub Copilot, and Amazon Bedrock |
| Execution | Linux containers through a local Docker daemon |
| Host platforms | Linux and macOS, amd64 and arm64 |
| Pipelines | Ordered, fail-fast workflows with shared working state |

BERBench Cloud is optional. Local execution and evidence do not require a
login. When Cloud is available and you are signed in, completed runs are synced
idempotently; otherwise they remain on disk for a later `berbench sync`.

## Continue

| Goal | Guide |
| --- | --- |
| Prepare a repository | [Getting started](getting-started.md) |
| Complete one measurement | [Run your first evaluation](run-an-experiment.md) |
| Choose and validate good work items | [Tasks](challenges.md) |
| Build a controlled comparison | [Evaluations](experiments.md) |
| Configure every public file | [YAML reference](yaml-reference.md) |
| Compare plan/build/review pipelines | [Workflow pipelines](how-to/workflows.md) |
| Run Claude Code through AWS | [Amazon Bedrock](how-to/bedrock.md) |
| Let an agent guide setup and operation | [Agent skill](skill.md) |
