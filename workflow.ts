import { END, START, StateGraph, StateSchema } from '@langchain/langgraph';
import { z } from 'zod/v4';
import type { AgentResult, AgentTask } from './types.js';
import { ElitzeAgent } from './agent.js';

const TaskSchema = z.object({
  id: z.string().min(1),
  objective: z.string().min(1),
  context: z.string().optional(),
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  expectedOutput: z.string().optional(),
  tools: z.array(z.string()).optional(),
  maxAttempts: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

const WorkflowState = new StateSchema({
  task: TaskSchema,
  result: z.custom<AgentResult>().optional(),
});

export type ElitzeWorkflowState = typeof WorkflowState.State;

export function createElitzeWorkflow(agent: ElitzeAgent) {
  return new StateGraph(WorkflowState)
    .addNode('execute', async (state: ElitzeWorkflowState) => ({
      result: await agent.run(state.task as AgentTask),
    }))
    .addEdge(START, 'execute')
    .addEdge('execute', END)
    .compile();
}
