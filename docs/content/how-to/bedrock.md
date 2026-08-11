---
sidebar_label: Run Claude Code on Bedrock
---

# Run Claude Code on Amazon Bedrock

By default `claude-code` talks to the Anthropic API. The built-in `provider`
option switches it to Anthropic models served by **Amazon Bedrock** instead:
your AWS account is billed, and traffic goes to `bedrock-runtime` rather than
`api.anthropic.com`.

Everything else about the run is unchanged — same container, same prompt, same
verifier. Only the endpoint, the credentials, and the egress allowlist differ.

## Before you start

- Bedrock model access for the Anthropic models you want, enabled in the AWS
  account and region you will use.
- AWS credentials on the host: either a profile in `~/.aws/credentials` or
  `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (plus `AWS_SESSION_TOKEN` for
  temporary credentials).
- A working berbench project. If you do not have one yet, start with
  [Getting started](../getting-started.md).

## 1. Export the region

```bash
export AWS_REGION=us-east-1
```

This one is not optional. Claude Code does **not** read the region from
`~/.aws/config` when running on Bedrock, so berbench refuses a Bedrock cell
whose host has no `AWS_REGION` — before the container starts, rather than
letting it fail a minute into the run.

## 2. Point at your credentials

Pick whichever you already use:

```bash
# A named profile from ~/.aws/credentials
export AWS_PROFILE=benchmarks

# …or keys straight from the environment
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...      # only for temporary credentials
```

Environment variables and credential files are not alternatives here — berbench
uses both at once. Every declared variable that is set is forwarded to the agent
container, and `~/.aws/credentials` and `~/.aws/config` are copied into a
`0700` temp directory, bind-mounted read only, and installed into the agent
user's home. A typical Bedrock run takes the region from the environment and the
keys from the file.

Credentials are never baked into an image or written to run results.

Check what berbench found:

```bash
berbench doctor
```

The `claude-code` line lists every credential source it resolved — the
variables it will forward, and each file it will stage, with the path it gets
inside the container:

```text
claude-code: [$AWS_REGION $AWS_PROFILE /home/you/.aws/credentials -> $HOME/.aws/credentials (staged read-only) ...]
```

## 3. Write the experiment

Bedrock cells need two things: a Bedrock **model key** and
`options: {provider: [bedrock]}`.

```yaml title=".ber/bench/experiments/bedrock.yaml"
tools:
  - tool: claude-code
    model: [bedrock/opus-5]
    effort: [high]
    options:
      provider: [bedrock]
```

:::note

Write this file by hand or with `berbench experiment edit`. The
`berbench experiment create` shorthand splits a spec on `/`, so a model key that
itself contains a slash — `bedrock/opus-5` — cannot be expressed on the command
line.

:::

To compare the same model on both services in one run, list both provider
values. They are separate cells with separate results, and never reuse each
other's:

```yaml
tools:
  - tool: claude-code
    model: [opus-5]
    effort: [high]
  - tool: claude-code
    model: [bedrock/opus-5]
    effort: [high]
    options:
      provider: [bedrock]
```

Then validate before spending anything:

```bash
berbench experiment validate bedrock --verbose
berbench run bedrock --dry-run
```

## 4. Allow your region's endpoint

The shipped allowlist covers `us-east-1` only:

```text
bedrock-runtime.us-east-1.amazonaws.com
sts.amazonaws.com
```

The region is per-user and cannot be templated into the registry, so any other
region needs its host added explicitly:

```bash
berbench run bedrock --allow-host bedrock-runtime.eu-central-1.amazonaws.com
```

To make it permanent for the repository, put it in `.ber/bench/config.yaml`:

```yaml
agent:
  allow_hosts:
    - bedrock-runtime.eu-central-1.amazonaws.com
```

These hosts join the allowlist **only** for runs that actually select
`provider: bedrock`. A first-party run's egress never silently widens to AWS.

## 5. Price the Bedrock models

Bedrock is partner-operated with its own rate card, so Bedrock model keys ship
**unpriced** on purpose — a Bedrock cell can never be reported at first-party
rates. Until you supply rates, those cells report unknown cost and contribute
nothing to a run's cost total.

Add your AWS rates in USD per million tokens, keyed by the model **API id**
(not the short model key):

```yaml title="~/.config/ber/bench/pricing.yaml"
models:
  anthropic.claude-opus-5:
    input: 3.00
    cache_read: 0.30
    output: 15.00
```

This file is merged over the built-in prices key by key, so it only needs to
name the models you are adding.

## 6. Run it

```bash
berbench run bedrock --follow
berbench report latest
```

## What the `provider: bedrock` option does

| Effect | Detail |
|---|---|
| Environment | Sets `CLAUDE_CODE_USE_BEDROCK=1` in the agent container. |
| Egress | Adds `bedrock-runtime.us-east-1.amazonaws.com` and `sts.amazonaws.com`, for these cells only. |
| Required host variable | `AWS_REGION`, checked before the container starts. |
| Invocation | Unchanged — Claude Code's `--model` already accepts a Bedrock model id. |
| Cell identity | The option's environment is part of the cell fingerprint, so Bedrock and first-party cells are distinct and never reuse each other's results. |

## Adding a Bedrock model berbench has not shipped

Bedrock model keys are ordinary registry entries. Add one with a tool registry
overlay — no berbench release needed:

```yaml title="~/.config/ber/bench/tools/claude-code.yaml"
tool: claude-code
extends: builtin

models:
  bedrock/sonnet-5:
    id: <the Bedrock model id from AWS>
    effort: [low, medium, high, xhigh, max]
```

Overlays merge key by key, so nothing built in is lost. Remember to price the
new id in `pricing.yaml`, then re-check with `berbench doctor` and
`berbench experiment validate`.

See [Tool registry overlays](../yaml-reference.md#tool-registry-overlays) for
the full overlay rules.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `AWS_REGION is not set on this host, and this cell's options require it` | Export `AWS_REGION`. Claude Code does not read it from `~/.aws/config`. |
| Agent hangs or fails to reach the model API | The region's `bedrock-runtime` host is not on the allowlist. Add `--allow-host bedrock-runtime.<region>.amazonaws.com`. |
| Report shows unknown cost | The Bedrock model is unpriced. Add its API id to `pricing.yaml` (step 5). |
| `doctor` shows no credentials for `claude-code` | Neither an Anthropic variable nor any AWS variable or file was found. Export `AWS_PROFILE` or the key pair. |
| Unknown model `bedrock/…` | That key is not in the registry. The error prints the exact overlay file to write. |
