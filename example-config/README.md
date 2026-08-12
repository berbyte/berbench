# cc-conf-2 — challenge and experiment CLI output

This is a concrete gallery for the proposed `berbench` UX. It shows the YAML
that the new CLI would write; the current Go parser still reads
`tasks/`, `sweeps/`, and `catalog/`.

The examples model one initialized repository:

```text
.ber/bench/
├── config.yaml
├── challenges/
│   └── 13964/
│       ├── challenge.yaml
│       ├── issue.md
│       ├── tests.patch
│       ├── gold.patch
│       └── raw/
│           ├── issue.csv
│           └── pr.diff
└── experiments/
    ├── 01-minimal.yaml
    ├── 02-cross-tool.yaml
    ├── 03-effort-sweep.yaml
    ├── 04-project-doc-ab.yaml
    └── 05-advanced.yaml
```

`home/.config/ber/bench/` is a mock of the user's global configuration. It is
shown inside this gallery only so the complete resolution model can be reviewed.

## Invariants demonstrated here

- Every experiment tool block explicitly lists both `model` and `effort`.
  Even a single pinned value uses a one-item list.
- Lists are axes. Tool blocks form a union; lists inside a block form a cross
  product.
- Experiments never select challenges. `berbench run <experiment>` runs all
  local challenges; `--challenge <id>` narrows the invocation.
- Global files define the tool registry and defaults. A run archives the fully
  resolved configuration so later global edits cannot rewrite history.
- A harvested PR challenge is self-contained. Source, environment, prompt,
  hidden verifier, reference patch, and harvest/validation provenance live
  together.

## CLI walkthrough

```bash
berbench init
berbench challenge create 13964

berbench experiment create minimal claude-code
berbench experiment create cross-tool \
  claude-code codex

berbench run minimal
berbench run cross-tool --challenge 13964
```
