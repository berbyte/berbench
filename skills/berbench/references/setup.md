# Setup

The onboarding path the CLI cannot do alone.

## 1. Initialize, then read doctor

```bash
berbench init
berbench doctor
```

`init` writes `.ber/bench/config.yaml` and detects the git remote's provider.
`doctor` is the checklist — work its FAILs top to bottom. It checks: git and the
docker daemon, the project config and repo id, that `dockerfile:` is set and the
file exists, that the results directory is writable and **outside** the repo,
that the git host is reachable and authenticated, the tool registry, and which
models have no price (a warning, not a failure).

## 2. Write `Dockerfile.berbench`

**`berbench init` never generates this.** It is the one hard prerequisite, and
the main thing you are here to help with.

### The contract

- The **build context is the worktree at the challenge's `base_commit`**,
  exported with `git archive` semantics — no `.git` directory is present.
- The project source must end up at **`/workspace`**.
- Install everything needed to **run the test suite**, so that the container
  works with no network at run time (the agent's egress is restricted to its
  model API).
- **Do not install Claude Code or Codex.** berbench layers the selected tool on
  top of your image itself, and creates its own non-root agent user.
- The image is cached on `(base_commit, Dockerfile)`, so a change to either
  rebuilds.

Save it as `Dockerfile.berbench` in the repo root, or point `dockerfile:` in
`.ber/bench/config.yaml` at an existing image definition.

### Derive it from the repo, do not guess

Read, in this order:

1. **`.github/workflows/*.yml`** (or `.gitlab-ci.yml`) — usually the single best
   source of truth for the real install and test commands, and the language
   version the project actually supports.
2. **Lockfiles and manifests** — `pyproject.toml`, `poetry.lock`, `uv.lock`,
   `requirements*.txt`, `package.json` + `pnpm-lock.yaml`/`package-lock.json`,
   `go.mod`, `Cargo.toml`, `Gemfile.lock`.
3. Any existing `Dockerfile`, `Makefile`, `tox.ini`, `noxfile.py`.

Then confirm the test command actually runs before harvesting anything.

### Starting points

Python (pip, editable install):

```dockerfile
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends git build-essential \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
COPY . /workspace
RUN pip install --no-cache-dir -e ".[test]"
```

Python (uv):

```dockerfile
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /workspace
COPY . /workspace
RUN uv sync --frozen --all-extras
```

Node (pnpm):

```dockerfile
FROM node:22-slim
RUN corepack enable
WORKDIR /workspace
COPY . /workspace
RUN pnpm install --frozen-lockfile
```

Go:

```dockerfile
FROM golang:1.26
WORKDIR /workspace
COPY . /workspace
RUN go mod download && go build ./...
```

Rust:

```dockerfile
FROM rust:1-slim
WORKDIR /workspace
COPY . /workspace
RUN cargo fetch && cargo build --tests
```

Ruby:

```dockerfile
FROM ruby:3.3-slim
RUN apt-get update && apt-get install -y --no-install-recommends git build-essential \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
COPY . /workspace
RUN bundle install
```

Note `COPY . /workspace` before the install step is deliberate here: the context
is a single commit's tree, so layer-caching tricks that split manifests from
source buy little and risk installing against the wrong lockfile.

If the repo uses submodules, the first export clones them and needs network
access — that is expected.

## 3. Credentials

Check whether these are set. **Never print their values, never write them into a
file, never echo them into a command the user can see.** Testing with
`[ -n "$VAR" ] && echo set` is fine.

Git host:

- GitHub: `GITHUB_TOKEN` or `GH_TOKEN`, or an authenticated `gh auth login`.
- GitLab: `GITLAB_TOKEN`, or `glab auth login`.

AI tools:

- Claude Code: `ANTHROPIC_API_KEY`, or `CLAUDE_CODE_OAUTH_TOKEN`, or
  `~/.claude/.credentials.json`.
- Codex: `OPENAI_API_KEY`, or `~/.codex/auth.json`.

`berbench doctor` reports the git host one; the tool credentials show up as
failures at run time, so check them before a run rather than after.

## 4. Set `harvest.test_patterns` before harvesting

In `.ber/bench/config.yaml`:

```yaml
harvest:
  test_patterns:
    - "tests/**"
    - "**/*_test.go"
```

This glob list is how harvesting splits a PR's diff into `tests.patch` and
`gold.patch`. A wrong pattern is the **root cause of both** "empty test patch"
and "empty gold patch" — too narrow and no test file matches, too broad and it
swallows the fix. Look at where this repo actually keeps tests and set it before
running `challenge create`, not after.

Changing it later means re-creating the affected challenges; the split is done
at harvest time.

Also in `harvest:`: `prompt_source` is `issue` (default) or `pr_description` —
use the latter when this project's PRs carry the bug report and the linked
issues are thin.
