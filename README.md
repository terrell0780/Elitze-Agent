# ELITZE Agent

ELITZE Agent is the all-around agent runtime. It is not limited to cybersecurity. Security is one protected capability available to the broader agent system.

## Runtime architecture

- **LangGraph** provides the stateful workflow entry point.
- **ELITZE model router** selects a suitable configured model adapter and can fail over to another adapter.
- **OpenAI-compatible adapter** supports any endpoint that implements the OpenAI Chat Completions contract.
- **Frontier Judge** independently evaluates output for correctness, completeness, reasoning, evidence, safety, policy, and task fit.
- **Memory store** provides local contextual recall with confidence and expiry handling.
- **Capability registry** gives Agent Reach, Heretic, Obsidian, CRM, browser, code, MCP, and other integrations an explicit connection point without pretending an integration is connected when it is not.
- **OpenAI Agents SDK** is included for agent primitives, handoffs, tools, guardrails, sessions, tracing, and sandbox/voice integrations when those components are wired into the application layer.
- **NVIDIA NIM / NeMo** can be connected through the existing OpenAI-compatible adapter or through an application-specific NeMo runtime.

## B2B workflow target

The runtime is designed to host real workflows such as account research, lead qualification, prospect research, personalized outreach, follow-up, meeting preparation, CRM updates, proposal generation, task creation, and human handoff. Those actions require real tool handlers and credentials to be registered; the core does not fabricate external actions.

## Configuration

The repository intentionally does not contain API keys or provider secrets. Register model adapters with explicit endpoints and credentials in the host application.

Example model adapter:

```ts
import { OpenAICompatibleAdapter, ElitzeModelRouter } from './index.js';

const model = new OpenAICompatibleAdapter({
  name: 'enterprise-model',
  baseUrl: process.env.MODEL_BASE_URL ?? '',
  apiKey: process.env.MODEL_API_KEY,
  model: process.env.MODEL_NAME ?? '',
  capabilities: ['text', 'reasoning', 'coding', 'long-context'],
});

const router = new ElitzeModelRouter([model]);
```

## Development

Requires Node.js 22+.

```bash
npm install
npm run typecheck
npm test
```

`npm test` builds the TypeScript sources first, then runs the core smoke tests against the compiled output.

## Reality boundary

This repository currently provides the core runtime contracts and orchestration foundation. Agent Reach, Heretic, Obsidian, CRM, web, MCP, browser, code execution, and other external systems are **not** claimed to be live until a real handler is registered and successfully exercised.
