# berbench

**SWE-bench for your own codebase.**

berbench helps you find the best coding-agent setup for the software you
actually build. It turns merged pull requests from your repository into
reproducible coding challenges, runs tools and models against them in isolated
Docker containers, and compares the results by correctness, cost, tokens, patch
size, and time.

[Read the documentation](docs/content/index.md) ·
[Get started](docs/content/getting-started.md) ·
[Download a release](https://github.com/berbyte/berbench/releases)

## The problem

Public benchmarks are useful, but they cannot tell you which agent will work
best on *your* architecture, conventions, tests, and day-to-day tasks. Trying
agents on live work is difficult to compare: every task is different, the
expected solution is unknown, and a result may be influenced by leaked code or
an uncontrolled environment.

That makes important decisions hard to answer with evidence:

- Which coding tool and model should the team use?
- Is a more expensive model actually more reliable on this codebase?
- Did a new model, prompt, skill, plugin, or `AGENTS.md` improve the result?
- What does each successful solution cost, and how long does it take?

## The solution

berbench uses work your team has already completed as ground truth:

1. **Harvest** a merged pull request. The issue becomes the task, the repository
   before the fix becomes the starting point, the test changes become a hidden
   verifier, and the implementation changes become the reference solution.
2. **Validate** the challenge. berbench proves that the hidden tests fail before
   the known fix and pass after it.
3. **Compare** coding-agent configurations. Each tool, model, effort level, and
   option runs in a fresh Docker environment.
4. **Report** the outcome. A leaderboard ranks configurations by pass rate, then
   uses cost, tokens, patch size, and time to break ties.

The agent receives only the task and the pre-fix code. It does not receive the
hidden tests, reference solution, or upstream pull request. Network access is
restricted to the model APIs so the agent cannot simply fetch the finished
change from GitHub or GitLab.

## Why berbench

- **Relevant** — benchmark against real bugs and features from your own history.
- **Trustworthy** — hidden tests, prompt-leak checks, clean-room verification,
  and restricted network access protect the result.
- **Reproducible** — every attempt starts from the same commit in an isolated
  Docker container.
- **Comparable** — test a matrix of tools, models, effort levels, and agent
  configuration changes under the same conditions.
- **Practical** — see reliability alongside estimated cost, token usage, code
  changed, and elapsed time.

berbench currently supports GitHub and GitLab repositories, Claude Code and
Codex, Anthropic and OpenAI APIs, and Amazon Bedrock for Claude Code.

## Quick start

You need Git, a running Docker daemon, a repository with merged pull requests,
and credentials for its Git host and the coding tools you want to test.

Install the CLI on Linux or macOS:

```bash
curl -fsSL https://get.berbench.ber.run/install | bash
```

For guided setup, install the [berbench agent skill](docs/content/skill.md):

```bash
berbench skill install
```

Then ask your coding agent to set up berbench in the repository. The skill
guides it through inspecting the project's CI and dependencies, writing
`Dockerfile.berbench`, running `init` and `doctor`, and resolving setup checks.

In the repository you want to benchmark, add a `Dockerfile.berbench` that copies
the project to `/workspace` and installs everything required to run its tests.
Then initialize berbench:

```bash
cd /path/to/your/repository

berbench init
berbench doctor
```

`doctor` checks Docker, credentials, repository configuration, and the project
image. If this is your first setup, follow the
[complete setup guide](docs/content/getting-started.md) for Dockerfile and
credential examples.

Create and validate a challenge from a merged pull request:

```bash
berbench challenge scan
berbench challenge create <pull-request-number>
berbench challenge lint <pull-request-number>
berbench challenge validate <pull-request-number>
```

Define what you want to compare, preview the work and cost, and run it:

```bash
berbench experiment create smoke
berbench experiment validate smoke --verbose

berbench run smoke --dry-run
berbench run smoke --follow
berbench report latest
```

Always inspect the dry run before starting. The number of experiment cells
multiplied by the number of validated challenges is the number of paid agent
runs.

Commit `.ber/bench/` with your repository. It contains the challenge and
experiment definitions, making the benchmark reviewable and repeatable. Run
results are stored outside the repository and should not be committed.

## Documentation

The full documentation covers the workflow and all configuration options:

| Goal | Guide |
| --- | --- |
| Understand the core concepts and capabilities | [Overview](docs/content/index.md) |
| Install berbench and prepare a repository | [Getting started](docs/content/getting-started.md) |
| Run a benchmark from start to finish | [Run your first benchmark](docs/content/run-an-experiment.md) |
| Find, create, and validate good challenges | [Challenges](docs/content/challenges.md) |
| Design a fair tool and model comparison | [Experiments](docs/content/experiments.md) |
| Configure every available field | [YAML reference](docs/content/yaml-reference.md) |
| Use Claude Code with Amazon Bedrock | [Amazon Bedrock guide](docs/content/how-to/bedrock.md) |
| Let a coding agent guide the workflow | [Agent skill](docs/content/skill.md) |

## This repository

This public repository contains the installation script, the documentation
site in [`docs/`](docs), and the berbench agent skill and plugin manifests. The
CLI is distributed as prebuilt binaries on the
[GitHub releases page](https://github.com/berbyte/berbench/releases).
