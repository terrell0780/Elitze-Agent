# ELITZE Agent

ELITZE Agent is the all-around agent runtime. It is not limited to cybersecurity. Security is a protected capability available to the broader agent system.

## Frontier architecture

- **LangGraph** provides durable, stateful workflow orchestration.
- **OpenAI Agents SDK** provides agent primitives, handoffs, guardrails, sessions, tracing, sandbox and voice integration points.
- **Model router** selects a suitable configured provider/model and can fail over.
- **NVIDIA NIM / NeMo Agent Toolkit** can be connected through OpenAI-compatible inference or an application-specific NeMo runtime.
- **Agent Skills** provides progressive-disclosure `SKILL.md` capabilities that can be versioned and loaded on demand.
- **Capability Registry** provides explicit connection points for Agent Reach, Heretic, Obsidian, CRM, browser, code, MCP, A2A and other tools.
- **Gods Eye** is a first-class, evidence-aware situational-awareness layer spanning world, web, organization, applications, agents, tools, models, data, security and execution. It correlates authorized observations into nodes, relationships and alerts while preserving source, timestamp, scope, confidence and evidence type.
- **Frontier execution contracts** cover tool risk/approval, isolated workspaces, subagents, event triggers, artifacts and durable run state.
- **Frontier Judge** evaluates correctness, completeness, reasoning, evidence, safety, policy and task fit.
- **Memory** provides contextual recall with confidence and expiry handling; production deployments can replace the local store with a durable/vector/hybrid implementation.

## Critical skills

The repository now includes initial skills for:

- research
- browser/computer-use
- coding
- B2B sales
- Gods Eye situational awareness
- multi-agent orchestration

The skill format follows the open Agent Skills convention: a skill is a directory containing a `SKILL.md` with YAML frontmatter and instructions, with optional scripts/references/assets. citeturn254579search0turn254579search1

## B2B workflow target

The runtime is designed to host real workflows such as account research, lead qualification, prospect research, personalized outreach, follow-up, meeting preparation, CRM updates, proposal generation, task creation, and human handoff. Those actions require real tool handlers, permissions, and credentials; the core does not fabricate external actions.

## Gods Eye principle

Gods Eye is not a claim of unrestricted surveillance or universal access. It is an agent control and awareness surface over **connected, authorized, observable sources**. Every observation must identify its provenance and whether it is observed, inferred, user-provided, or external.

## Production gap audit

A top-tier general agent requires more than a model and prompt. The next implementation layers are:

1. Real browser/computer-use adapter with post-action verification.
2. Durable persistent state/checkpointing for long-running runs.
3. Sandboxed filesystem and command execution with resource limits.
4. MCP + A2A clients/servers with tool filtering and approval policies.
5. Subagent spawning, cancellation, dependency tracking and result aggregation.
6. Event/webhook/schedule triggers and resumable background jobs.
7. Durable hybrid memory with tenant/user/agent scoping.
8. Streaming/realtime voice and multimodal inputs/outputs.
9. Artifact generation and persistent file handling.
10. Production tracing, telemetry, cost/latency accounting and evaluation datasets.
11. B2B connectors for CRM, email, calendar, enrichment and approved outbound channels.
12. A benchmark harness spanning browsing, computer use, coding, research, MCP and long-horizon real-world work.

Current agent research supports this direction: AgencyBench evaluates long-horizon real-world tasks with multiple tools and large contexts; OSWorld evaluates computer use in real desktop environments; OpenAI's Agents SDK provides sandbox, handoff, MCP, session, guardrail and tracing primitives; NVIDIA NeMo Agent Toolkit provides MCP/A2A, evaluation and observability capabilities. citeturn116142search1turn116142search2turn363878search1turn363878search14

## Configuration

The repository intentionally does not contain API keys or provider secrets. Register model adapters, capability handlers, tool runtimes and data sources in the host application.

## Development

Requires Node.js 22+.

```bash
npm install
npm run typecheck
npm test
```

## Reality boundary

This repository currently provides the core runtime contracts and orchestration foundation. Agent Reach, Heretic, Obsidian, CRM, web/browser, MCP/A2A, code execution, sandboxing and external services are **not** claimed to be live until a real handler is registered and successfully exercised.
