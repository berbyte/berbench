---
sidebar_label: Amazon Bedrock
---

# Run Claude Code on Amazon Bedrock

BERBench exposes Bedrock as the separate `claude-code-bedrock` tool. It still
runs Claude Code, but its models, AWS credentials, network rules, region, and
pricing are explicit cell inputs instead of hidden options on the first-party
tool.

## 1. Prepare AWS access

Enable the desired Claude inference profile in your AWS account and export a
region:

```bash
export AWS_REGION=us-east-1
```

Then use one supported credential route:

```bash
# Bedrock bearer token
export AWS_BEARER_TOKEN_BEDROCK=...

# or access keys
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...   # temporary credentials only

# or a profile from ~/.aws/credentials
export AWS_PROFILE=benchmarks
```

BERBench may stage `~/.aws/credentials` and `~/.aws/config` read-only in the
agent home. Credentials are never baked into an image or written to results.
EC2 instance metadata is disabled inside the cell.

## 2. Check the route

```bash
berbench doctor
```

For a selected Bedrock evaluation, `doctor` checks the region, credential
route, and configured inference profiles before a paid run.

## 3. Write an evaluation

```yaml title=".ber/bench/evaluations/bedrock.yaml"
apiVersion: bench.ber.run/v1alpha1
kind: Evaluation
attempts: 1

tools:
  - tool: claude-code-bedrock
    model: sonnet-4.6-us
    effort: medium
```

The built-in tool includes US Sonnet 4.6 and Opus 4.6 inference profiles. Model
keys and IDs are release-specific, so validate the file against the installed
registry:

```bash
berbench evaluation validate bedrock
berbench run bedrock --dry-run
```

The built-in Bedrock network policy allows the regional Bedrock and Bedrock
Runtime API paths. It does not grant access to S3, EC2 metadata, code forges, or
arbitrary AWS APIs.

## 4. Add an inference profile

Add account- and geography-specific profiles through a project overlay:

```yaml title=".ber/bench/tools/claude-code-bedrock.yaml"
apiVersion: bench.ber.run/v1alpha1
kind: Tool
tool: claude-code-bedrock
extends: builtin

models:
  sonnet-4.6-eu:
    id: eu.anthropic.claude-sonnet-4-6
    effort: [low, medium, high, max]
```

An exact system inference-profile ID or application inference-profile ARN is
required. Moving aliases such as `sonnet` are invalid because they make two
runs with the same configuration select different models.

## 5. Add AWS pricing

Bedrock rates depend on the inference profile and region. BERBench does not
apply first-party Anthropic rates to Bedrock models. Add the exact resolved
model ID to `~/.config/ber/bench/pricing.yaml`:

```yaml
apiVersion: bench.ber.run/v1alpha1
kind: Pricing

models:
  us.anthropic.claude-sonnet-4-6:
    input: 3.30
    cache_read: 0.33
    output: 16.50
```

Use the rates AWS invoices for your profile and region. Until then, cell cost
is unknown and contributes nothing to a run total.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Region is missing | Export `AWS_REGION` or `AWS_DEFAULT_REGION`. |
| No usable credentials | Supply a bearer token, access-key set, or named profile. |
| Unknown model key | Add an exact profile in the tool overlay. |
| Unknown cost | Add the resolved profile ID to user pricing. |
| Access denied | Confirm model access, profile geography, IAM permissions, and the selected region in AWS. |
