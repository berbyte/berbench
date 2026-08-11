---
sidebar_label: Getting started
---

# Getting started

## What you need

- Go 1.26 to build berbench
- Git
- A running Docker daemon
- A GitHub or GitLab repository with merged pull requests
- Credentials for the git host and the AI tool you want to test

From the berbench source directory, build the CLI:

```bash
go build -o berbench ./cmd/berbench
mkdir -p ~/.local/bin
install -m 755 berbench ~/.local/bin/berbench
```

The last command is optional. You can also run `./berbench` from the build
directory.

## 1. Prepare your repository

berbench builds a Docker image for each challenge. Add a Dockerfile that copies
the repository to `/workspace` and installs the dependencies needed to run its
tests.

Example for a Python project:

```dockerfile
FROM python:3.12-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY . /workspace
RUN pip install --no-cache-dir -e .
```

Save it as `Dockerfile.berbench` in the repository root. berbench can also use
an existing Dockerfile; set its path in `.ber/bench/config.yaml`.

Do not install Claude Code or Codex in this image. berbench adds the selected
tool itself.

## 2. Configure credentials

For the git host, use an environment variable or an authenticated CLI:

```bash
# GitHub: GITHUB_TOKEN or GH_TOKEN, or `gh auth login`
# GitLab: GITLAB_TOKEN, or `glab auth login`
```

For AI tools, berbench recognizes:

```bash
# Claude Code
export ANTHROPIC_API_KEY=...
# or CLAUDE_CODE_OAUTH_TOKEN / ~/.claude/.credentials.json

# Codex
export OPENAI_API_KEY=...
# or ~/.codex/auth.json
```

Credentials are passed to the agent container at run time. They are not baked
into images or copied to run results.

Using a cloud provider instead of the first-party API? See
[Run Claude Code on Amazon Bedrock](how-to/bedrock.md).

## 3. Initialize berbench

Run this from the repository you want to benchmark:

```bash
cd /path/to/your/repository
berbench init
berbench doctor
```

`init` creates `.ber/bench/`, detects the git remote, and records the
Dockerfile. `doctor` checks Git, Docker, host access, credentials, configs, and
existing challenges.

Commit `.ber/bench/`. It contains benchmark definitions, not run output.

Run results live outside the repository under
`$XDG_DATA_HOME/berbench/<repo-id>/`, or `~/.local/share/berbench/<repo-id>/`
when `XDG_DATA_HOME` is unset.

## Next

Read [Challenges](challenges.md), then follow the
[end-to-end run guide](run-an-experiment.md).

Configuring a specific setup? The [how-to guides](how-to/bedrock.md) cover the
cases that need extra steps.
