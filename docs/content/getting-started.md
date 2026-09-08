---
sidebar_label: Getting started
---

# Getting started

This guide prepares one repository for trustworthy, repeatable evaluations.

## Requirements

- Git
- A running Docker daemon
- A GitHub or GitLab repository with merged pull requests
- Credentials for the repository host
- Credentials for each coding tool you intend to run

The host may be Linux or macOS on amd64 or arm64. Windows is not supported.

## 1. Install BERBench

```bash
curl -fsSL https://get.berbench.com/install | bash
```

The installer downloads the matching release archive and checks its SHA-256
when the release and host provide checksum support. It tries `~/.local/bin`,
then `~/bin`, then another writable absolute directory already on `PATH`.

Optional installer variables:

| Variable | Purpose |
| --- | --- |
| `BERBENCH_BIN_DIR` | Choose the installation directory. |
| `BERBENCH_VERSION` | Install a specific release such as `v1.4.2`. |

## 2. Initialize the repository

```bash
cd /path/to/repository
berbench init
```

`init` detects the Git remote, creates `.ber/bench/`, and installs matching
JSON Schemas and agent skills in your user configuration directory. It never
overwrites settings you wrote and never invents a project Dockerfile.

If the detected remote is a fork, an interactive `init` can select its upstream.
Choose carefully: local history may contain upstream changes, but pull-request
numbers are scoped to one repository.

Commit `.ber/bench/`. It contains public benchmark definitions, not results or
credentials.

## 3. Write `Dockerfile.berbench`

BERBench builds the task's project image from source exported at its base
commit. The build context has no `.git` directory. Your Dockerfile must:

- copy the repository to `/workspace`;
- install all dependencies required to build and test with no runtime fetches;
- provide `/bin/sh`, `id`, `chown`, user/group creation commands, and a CA
  certificate bundle; and
- use a writable, shell-capable base image.

Do not install Claude Code, Codex, or Copilot in this image. BERBench supplies
the selected CLI separately and runs it as a non-root agent user.

Example for Python:

```dockerfile
FROM python:3.12-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git build-essential ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY . /workspace
RUN pip install --no-cache-dir -e ".[test]"
```

Derive the language version, install steps, and test dependencies from the
repository's CI configuration and lockfiles. Distroless, shell-less, and
read-only-root images cannot host an agent; use a separate benchmark Dockerfile
when the production image has those properties.

## 4. Make credentials available

For the repository host, BERBench accepts:

```bash
# GitHub
export GITHUB_TOKEN=...
# or GH_TOKEN, or an authenticated `gh`

# GitLab
export GITLAB_TOKEN=...
# or an authenticated `glab`
```

For built-in coding tools:

```bash
# Claude Code
export ANTHROPIC_API_KEY=...
# or CLAUDE_CODE_OAUTH_TOKEN / ~/.claude/.credentials.json

# Codex
export OPENAI_API_KEY=...
# or ~/.codex/auth.json

# Copilot
export COPILOT_GITHUB_TOKEN=...
```

Never put credentials in `.ber/bench/`, the Dockerfile, an image, or a tool
overlay. BERBench forwards only the credential route declared by the selected
tool and refuses expired credentials when the tool definition exposes an expiry
field.

For AWS, follow [Claude Code on Amazon Bedrock](how-to/bedrock.md).

## 5. Check readiness

```bash
berbench doctor
```

`doctor` checks Git, Docker, the project config, Dockerfile, result store,
schemas, installed skills, tool registry, login state, and relevant provider
credentials. It reports all failures together and gives a next action for each.

Results must remain outside the benchmarked repository. By default they live
under:

```text
$XDG_DATA_HOME/berbench/<repo-id>/
```

When `XDG_DATA_HOME` is unset, BERBench uses
`~/.local/share/berbench/<repo-id>/`.

## 6. Link the optional agent skill

`init` installs a BERBench-owned skill tree. Link the skill once into the agent
you use, following the exact command printed by `init` or `doctor`. A symlink
lets `berbench update` refresh the skill together with the CLI; a copied skill
can silently become stale.

See [Agent skill](skill.md) for the contract the skill enforces.

## Next

Create a trustworthy [task](challenges.md), then follow the
[end-to-end evaluation guide](run-an-experiment.md).
