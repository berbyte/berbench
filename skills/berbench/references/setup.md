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
file exists, the image mode and whether `env_commit` is pinned, that the results
directory is writable and **outside** the repo, that the git host is reachable
and authenticated, **whether this project's issues live on the forge at all**,
the tool registry, and which models have no price (a warning, not a failure).

Read its warnings too, not only its FAILs. Two of them save a whole re-harvest:
"issue tracker disabled" (step 5) and the per-challenge environment-drift notes.

## 2. Write `Dockerfile.berbench`

**`berbench init` never generates this.** It is the one hard prerequisite, and
the main thing you are here to help with.

### The contract

- The **build context is a worktree exported with `git archive` semantics** —
  no `.git` directory is present, and none may be created.
- The project source must end up at **`/workspace`**.
- Install everything needed to **run the test suite**, so that the container
  works with no network at run time. Neither the agent phase nor the verify
  phase can fetch anything: the agent reaches its model API and nothing else,
  and verify has no network at all unless the challenge asks for it explicitly.
- **Do not assume the source in the image is the challenge's source.** By
  default BERBench builds **one image per repository**, from the pinned
  `docker.env_commit`, and copies each challenge's own tree into `/workspace`
  at run time. Your Dockerfile installs *dependencies*; BERBench supplies the
  *source*. Write the install step so it works against a tree that will be
  replaced — see "One image, many challenges" below.
- **Base it on glibc, not musl.** The agent CLIs arrive as a mounted Node
  runtime that will not execute on Alpine. Use `-slim`, `-bookworm`, or a
  Debian/Ubuntu base.
- **Do not install Claude Code or Codex.** BERBench mounts a shared read-only
  volume with every installable CLI in the resolved registry, and creates its
  own non-root agent user at container start. Credentials and egress stay per
  cell; a CLI on `PATH` is not authenticated.

### One image, many challenges

```yaml
docker:
  image_mode: shared        # shared (default) | per-commit
  env_commit: <sha>         # pinned by `berbench init`
```

`berbench init` pins `env_commit` to HEAD. Every challenge then reuses that one
image and gets its own `/workspace` staged in. This is not a micro-optimization:
keying the image on each challenge's base commit meant six flux2 challenges cost
six near-identical **6.9 GB** images and six builds.

What this asks of the Dockerfile:

- `COPY . /workspace` then install is still correct — the dependency install is
  what the image is for.
- An **editable install that hard-codes paths into site-packages** may need
  re-linking after the source is swapped. If so, add:

  ```yaml
  environment:
    sync:
      - pip install -e . --no-deps
  ```

  to the challenge. It runs after staging, under the same no-network policy as
  `environment.setup`. Django, flux2 and most repositories need nothing here:
  they run their tests from the working tree.

- If a challenge's base commit genuinely wants different dependencies, give that
  one challenge its own image with `environment.image_mode: per-commit`.
  `berbench doctor` tells you which challenges need it — it diffs each base
  commit's dependency manifests against `env_commit` and names the files.

Set `image_mode: per-commit` at the project level only if the repository's
dependencies churn constantly. It is always correct and usually expensive.

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

`COPY . /workspace` before the install step is deliberate: the context is a
single commit's tree, and splitting manifests from source to win a cache layer
risks installing against the wrong lockfile. The image is built once per
repository anyway, so there is little left to save.

If the repo uses submodules, the first export clones them and needs network
access — that is expected.

Rebuild from scratch with `berbench run --rebuild-env` or
`berbench challenge validate --rebuild-env` when the Dockerfile's package
resolution has moved but its text has not.

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

`berbench doctor` reports the Git host one; the tool credentials show up as
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

## 5. If issues live somewhere else, say so before harvesting

Run `berbench doctor` and look at the **Git host** section. If it says the
repository has its issue tracker disabled, **stop and write the tracker block
before harvesting anything.** Otherwise every `#123` in every pull request
resolves to nothing, every prompt silently falls back to the PR description —
which restates the fix — and you will not notice until someone reads one.

`doctor` prints the exact block, guessed from the project's own contributor
documentation. Paste it into `.ber/bench/config.yaml`:

```yaml
harvest:
  issue_tracker:
    kind: trac                                    # trac | jira | bugzilla | redmine | url
    url: https://code.djangoproject.com/ticket/{id}
    ref_patterns:
      - '(?i)ticket[-_ #]?(\d+)'                  # extra spellings this project uses
```

- `kind: trac` and `kind: jira` are **read**: BERBench fetches the ticket and
  writes a real `issue.md` from its summary and description.
- `bugzilla`, `redmine` and `url` are **archived**: the raw response is saved
  under `raw/` and `issue.md` becomes a stub that needs a human edit.
- `ref_patterns` are Go regular expressions with exactly one capture group for
  the id. They matter more than they look: Django's PR bodies say
  `#### Trac ticket number` / `ticket-37259` and never spell out a URL, so
  without a pattern the ticket number is invisible to every standard reference
  syntax.

Once it is set, `#37259` in a PR title is redirected to the tracker instead of
being dropped, `challenge scan --require-issue` returns candidates, and
`challenge create` produces `prompt_source: issue`.

`doctor` also warns when more than half of a project's challenges have
`prompt_source: pr_description`. Treat that as the same problem.

### Worked example: Django

Django is the hard case — GitHub Issues disabled, work tracked on Trac, a
bespoke test runner. The whole path:

```bash
berbench init                     # detects github.com/django/django, pins env_commit
berbench doctor                   # warns: issue tracker disabled, prints the Trac block
# paste the block into .ber/bench/config.yaml
berbench challenge scan --require-issue --max-gold-files 3 --json
berbench challenge create 21749   # prompt_source: issue, from code.djangoproject.com
berbench challenge validate 21749 # base_fail: true, gold_pass: true, tests_ran: 6
```

`harvest.test_patterns` for Django is `["tests/**"]`. The derived verify script
is `python tests/runtests.py --settings=test_sqlite --parallel 1 --verbosity 2
basic.tests.ModelFromDbTests` — note `basic.tests`, the module, not `basic`, the
app. Do not shorten it.
