---
sidebar_label: Agent skill
---

# Agent skill

BERBench can check configuration, isolation, and verifier outcomes. It cannot
decide how an unfamiliar repository should be built or whether a harvested task
is a fair representation of the original issue. The bundled agent skill guides
a coding agent through that judgment work.

## Install and link

`berbench init` installs the skill under the BERBench-owned user configuration
tree. `berbench update` refreshes it together with the CLI. Link that directory
once into the skill directory used by Claude Code or Codex:

```bash
berbench init
berbench doctor
```

Both commands print the exact link state and, when needed, the command for your
machine. BERBench does not write into an agent-owned configuration directory on
your behalf.

Use a symlink, not a copy. A link follows CLI updates; a copied skill can keep
describing an older command or file format. `doctor` reports a link as linked,
absent, or shadowed by an unrelated file or directory.

## What the skill helps with

The main `SKILL.md` routes the agent to one focused reference:

| Work | Guidance |
| --- | --- |
| First-time setup | Repository inspection, `Dockerfile.berbench`, credentials, and `doctor` |
| Task creation | Candidate selection, harvest review, answer-leak checks, and validation |
| Evaluation design | Matrix arithmetic, controls, preview, approval, and result interpretation |
| Workflows | Step definitions, handover files, controls, and per-step results |
| Failures | Symptom-to-cause troubleshooting without exposing credentials |

## Safety rules

The skill requires the agent to:

- preview every paid run and obtain explicit approval before starting it;
- avoid interactive commands in non-interactive automation;
- keep workflow handover files outside the graded working tree;
- let only `task validate` write validation evidence;
- keep code-forge hosts out of agent egress;
- remove answer locations from task prompts; and
- commit `.ber/bench/` but never local results or credentials.

These rules protect benchmark validity, real API spend, and user data. They are
part of the workflow, not optional advice.
