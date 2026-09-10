import { ElitzeFrontierJudge } from './judge.js';
import { LocalMemoryStore, type MemoryStore } from './memory.js';
import { ElitzeModelRouter } from './router.js';
import type { AgentResult, AgentTask, JudgeResult, ModelResponse } from './types.js';

const MAX_ATTEMPTS = 3;

export class ElitzeAgent {
  constructor(
    private readonly router: ElitzeModelRouter,
    private readonly judge: ElitzeFrontierJudge,
    private readonly memory: MemoryStore = new LocalMemoryStore(),
  ) {}

  async run(task: AgentTask): Promise<AgentResult> {
    this.validateTask(task);

    const maxAttempts = Math.max(1, Math.min(10, task.maxAttempts ?? MAX_ATTEMPTS));
    let lastAnswer = '';
    let lastModel: ModelResponse | undefined;
    let judgeResult: JudgeResult | undefined;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const memories = await this.memory.search(task.objective, 8);
        const request = this.buildRequest(
          task,
          memories.map(memory => ({
            id: memory.id,
            source: memory.source,
            confidence: memory.confidence,
            text: memory.text,
          })),
          lastAnswer,
          judgeResult,
        );

        const response = await this.router.generate(task, request);
        lastModel = response;
        lastAnswer = response.text;

        judgeResult = await this.judge.evaluate({
          objective: task.objective,
          context: task.context,
          answer: lastAnswer,
          risk: task.risk,
        });

        await this.memory.put({
          id: `${task.id}:${attempt}`,
          taskId: task.id,
          text: `Objective: ${task.objective}\nAnswer: ${lastAnswer}\nJudge decision: ${judgeResult.decision}\nJudge score: ${judgeResult.score}`,
          source: `ELITZE:${response.provider}:${response.model}`,
          confidence: judgeResult.score / 100,
          createdAt: new Date().toISOString(),
        });

        if (judgeResult.decision === 'PASS') {
          return {
            taskId: task.id,
            answer: lastAnswer,
            model: response,
            judge: judgeResult,
            attempts: attempt,
            status: 'COMPLETED',
          };
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!lastModel || !judgeResult) {
      throw new Error(
        `ELITZE produced no evaluated result: ${lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error')}`,
      );
    }

    return {
      taskId: task.id,
      answer: lastAnswer,
      model: lastModel,
      judge: judgeResult,
      attempts: maxAttempts,
      status: judgeResult.decision === 'REVIEW' ? 'REVIEW' : 'FAILED',
    };
  }

  private buildRequest(
    task: AgentTask,
    memories: Array<{ id: string; source: string; confidence: number | null; text: string }>,
    previousAnswer: string,
    previousJudge?: JudgeResult,
  ) {
    const repairs = previousJudge?.requiredRepairs ?? [];
    return {
      system: [
        'You are ELITZE, an autonomous general-purpose agent.',
        'Work toward the stated objective using only available capabilities.',
        'Separate verified facts from assumptions.',
        'Never claim an external action, tool execution, access, browsing result, or verification unless it actually occurred.',
        'Treat memory as contextual evidence, not authoritative truth.',
        'When evidence is insufficient, say so explicitly.',
      ].join(' '),
      user: JSON.stringify({
        objective: task.objective,
        context: task.context ?? '',
        risk: task.risk ?? 'MEDIUM',
        expectedOutput: task.expectedOutput ?? '',
        tools: task.tools ?? [],
        metadata: task.metadata ?? {},
        memory: memories,
        previousAttempt: previousAnswer || undefined,
        judgeRepairs: repairs,
      }),
      temperature: 0.2,
      maxTokens: 6000,
    };
  }

  private validateTask(task: AgentTask): void {
    if (!task.id?.trim()) throw new Error('Agent task id is required.');
    if (!task.objective?.trim()) throw new Error('Agent task objective is required.');
    if (task.maxAttempts !== undefined && (!Number.isInteger(task.maxAttempts) || task.maxAttempts < 1)) {
      throw new Error('Agent task maxAttempts must be a positive integer.');
    }
  }
}
