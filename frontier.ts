import type { AgentTask, ModelResponse } from './types.js';

export type ToolRisk = 'READ' | 'WRITE' | 'DESTRUCTIVE';

export type ToolApproval = {
  required: boolean;
  reason: string;
  expiresAt?: string;
};

export type ToolDefinition = {
  name: string;
  description: string;
  risk: ToolRisk;
  execute: (input: unknown) => Promise<unknown>;
  authorize?: (input: unknown) => Promise<ToolApproval>;
};

export type ToolExecution = {
  tool: string;
  input: unknown;
  output?: unknown;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  approved: boolean;
};

export interface ToolRuntime {
  register(tool: ToolDefinition): void;
  list(): ToolDefinition[];
  execute(name: string, input: unknown, approval?: () => Promise<boolean>): Promise<ToolExecution>;
}

export interface WorkspaceRuntime {
  create(task: AgentTask): Promise<{ id: string; root: string }>;
  exec(id: string, command: string): Promise<{ stdout: string; stderr: string; exitCode: number }>;
  destroy(id: string): Promise<void>;
}

export interface AgentRuntime {
  run(task: AgentTask): Promise<{ answer: string; model: ModelResponse }>;
}

export interface SubagentRuntime {
  spawn(task: AgentTask): Promise<{ id: string }>;
  await(id: string): Promise<AgentTaskResult>;
}

export type AgentTaskResult = {
  id: string;
  status: 'COMPLETED' | 'REVIEW' | 'FAILED';
  answer: string;
  evidence?: string[];
};

export type AgentEvent = {
  id: string;
  type: 'MESSAGE' | 'WEBHOOK' | 'SCHEDULE' | 'FILE_CHANGE' | 'CRON' | 'AGENT_REQUEST';
  createdAt: string;
  payload: Record<string, unknown>;
};

export interface EventBus {
  publish(event: AgentEvent): Promise<void>;
  subscribe(type: AgentEvent['type'], handler: (event: AgentEvent) => Promise<void>): () => void;
}

export type Artifact = {
  id: string;
  name: string;
  mimeType: string;
  uri?: string;
  bytes?: number;
  createdAt: string;
};

export interface ArtifactStore {
  put(artifact: Artifact, content: Uint8Array): Promise<void>;
  get(id: string): Promise<{ artifact: Artifact; content: Uint8Array } | undefined>;
}

export type FrontierRun = {
  id: string;
  taskId: string;
  startedAt: string;
  finishedAt?: string;
  status: 'RUNNING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'REVIEW' | 'FAILED';
  toolExecutions: ToolExecution[];
  artifacts: Artifact[];
};
