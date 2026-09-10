export type AgentTask = {
  id: string;
  objective: string;
  context?: string;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expectedOutput?: string;
  tools?: string[];
};

export type ModelRequest = {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export type ModelResponse = {
  text: string;
  model: string;
  provider: string;
  latencyMs: number;
};

export interface ModelAdapter {
  readonly name: string;
  readonly capabilities: string[];
  generate(request: ModelRequest): Promise<ModelResponse>;
}

export type JudgeDimension =
  | 'CORRECTNESS'
  | 'COMPLETENESS'
  | 'REASONING'
  | 'EVIDENCE'
  | 'SAFETY'
  | 'POLICY'
  | 'TASK_FIT';

export type JudgeResult = {
  decision: 'PASS' | 'REVIEW' | 'FAIL';
  score: number;
  reasons: string[];
  dimensions: Record<JudgeDimension, number>;
  requiredRepairs: string[];
  evidenceRequired: string[];
};

export type AgentResult = {
  taskId: string;
  answer: string;
  model: ModelResponse;
  judge: JudgeResult;
  attempts: number;
  status: 'COMPLETED' | 'REVIEW' | 'FAILED';
};
