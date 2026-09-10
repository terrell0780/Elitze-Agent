# ELITZE Agent frontier evaluation

The goal is not to claim parity with any outside agent. The goal is to make ELITZE measurable on the capabilities that matter for real autonomous work.

## Evaluation families

### Browsing and research

- Hard multi-hop retrieval and source reconciliation.
- Source provenance and citation correctness.
- Persistence under dead ends, conflicting sources, and stale information.

### Computer use

- Browser navigation, forms, file management, spreadsheets, and desktop workflows.
- Post-action verification and recovery from UI changes.
- No unverified claims of successful external actions.

### Coding

- Repository inspection, implementation, tests, debugging, and review.
- Long-running work with resumable state.
- Diff quality, regression rate, security findings, and test coverage.

### Tool and agent interoperability

- MCP tool discovery, filtering, authorization, execution, and tracing.
- A2A discovery, delegation, result validation, and cancellation.
- Multiple tool servers with overlapping names and conflicting schemas.

### Long-horizon autonomy

Measure end-to-end completion, not intermediate reasoning quality. Track:

- task success rate
- verified outcome rate
- tool-call count
- unnecessary action rate
- recovery rate after failure
- human intervention rate
- latency
- token/model cost
- policy violations
- evidence completeness

### B2B execution

Use real test tenants and synthetic-but-clearly-labeled test accounts to evaluate:

- account research
- qualification
- contact research
- personalized draft generation
- approval-gated outbound actions
- reply classification
- follow-up sequencing
- meeting preparation
- CRM synchronization
- proposal/document production

## Reference benchmarks

AgencyBench focuses on long-horizon real-world workflows and reports scenarios with an average of roughly 90 tool calls and 1M tokens. OSWorld evaluates multimodal agents operating in real computer environments. BrowseComp evaluates difficult web research requiring persistent browsing and strategic search. Use these as reference families, not as evidence of ELITZE performance until ELITZE is actually evaluated. citeturn116142search1turn116142search2turn116142search0

## ELITZE-specific frontier score

A run should only be considered successful when the requested outcome is independently verifiable. The score should combine outcome correctness, evidence quality, execution efficiency, recovery behavior, and policy compliance rather than relying on an LLM judge alone.
