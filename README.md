# berbench

**Which AI coding tool is actually best on _your_ codebase?**

berbench answers that with evidence instead of vibes. It turns merged pull
requests from your own repository into reproducible bug-fixing tasks, runs
coding agents against them in isolated containers, and ranks the results by pass
rate, cost, tokens, patch size, and time.

1. **Harvest** — pick a merged pull request. berbench splits it into an issue, a
   starting commit, hidden tests, and the known fix.
2. **Validate** — prove the task is real: the hidden tests must fail before the
   fix and pass after it.
3. **Compare** — run a matrix of tool × model × effort against it.

The agent gets the issue and the pre-fix code. It never sees the pull request,
the hidden tests, or the reference fix — and by default it cannot reach GitHub
or GitLab to look them up.

## What is in this repository

- **`skills/berbench/`** — the agent skill: berbench's own workflow written as
  procedure for a coding agent.
- **`.claude-plugin/`** — the Claude Code plugin and marketplace manifests that
  serve that skill.
- **`docs/`** — the documentation site.

The CLI is distributed as prebuilt binaries on the
[releases page](https://github.com/berbyte/berbench/releases).

## Install the CLI

Download the archive for your platform from
[releases](https://github.com/berbyte/berbench/releases) and put `berbench` on
your `PATH`:

```bash
tar -xzf berbench_<version>_<os>_<arch>.tar.gz
sudo install berbench /usr/local/bin/
berbench doctor
```

Requires **Docker** — there is no host-direct fallback, because reproducibility
is the point — and **git**.

## Install the agent skill

Two of berbench's steps are judgment calls the CLI deliberately does not
automate: writing `Dockerfile.berbench`, and reviewing a freshly harvested
challenge before validating it. The skill hands a coding agent berbench's rules
for both, including the guardrails that keep a run honest — never spend without
a `--dry-run` first, never let a code-forge host near the agent, never leak the
answer into the prompt.

Claude Code, as a plugin:

```
/plugin marketplace add berbyte/berbench
/plugin install berbench@berbench
```

Any agent that reads a directory of skills:

```bash
berbench skill install        # ~/.claude/skills, ~/.codex/skills — whichever exist
berbench skill install --project   # ./.claude/skills, so a team can commit it
berbench skill list --check        # where it is installed, and whether it is current
```

`skill install` fetches the files from this repository over HTTPS and caches
each commit, so improvements to the skill reach your agent without a CLI
release. Pass `--ref` to pin a branch, tag or commit.

## Documentation

The full documentation lives in [`docs/content/`](docs/content) — start with
[the overview](docs/content/index.md), then
[getting started](docs/content/getting-started.md) and
[run an experiment](docs/content/run-an-experiment.md).

To read it as a site:

```bash
cd docs
npm install
npm start
```
