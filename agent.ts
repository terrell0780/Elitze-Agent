import { ElitzeFrontierJudge } from './judge.js';
import { LocalMemoryStore, type MemoryStore } from './memory.js';
import { ElitzeModelRouter } from './router.js';
import type { AgentResult, AgentTask } from './types.js';

export class ElitzeAgent {
  constructor(
    private readonly router: ElitzeModelRouter,
    private readonly judge: ElitzeFrontierJudge,
    private readonly memory: MemoryStore = new LocalMemoryStore(),
  ) {}

  async run(task: AgentTask): Promise<AgentResult> {
    let lastAnswer = '';
    let lastModel;
    let judgeResult;

    for (let attempt = 1; attempt <= 3; attempt++) {
      const memories = await this.memory.search(task.objective);
      const model = this.router.select(task);
      const response = await model.generate({
        system: `You are ELITZE, a rigorous autonomous agent. Work toward the objective, distinguish facts from assumptions, preserve uncertainty, and never claim an action or verification you did not perform. Use the supplied memory only as contextual evidence, not unquestioned truth. Objective: ${task.objective}`,
        user: JSON.stringify({
          objective: task.objective,
          context: task.context ?? '',
          risk: task.risk ?? 'MEDIUM',
          expectedOutput: task.expectedOutput ?? '',
          tools: task.tools ?? [],
          memory: memories,
          previousAttempt: attempt > 1 ? lastAnswer : undefined,
          judgeRepairs: judgeResult?.requiredRepairs ?? [],
        }),
        temperature: 0.2,
        maxTokens: 6000,
      });

      lastAnswer = response.text;
      lastModel = response;
      judgeResult = await this.judge.evaluate({ objective: task.objective, context: task.context, answer: lastAnswer, risk: task.risk });

      await this.memory.put({
        id: `${task.id}:${attempt}`,
        taskId: task.id,
        text: `Objective: ${task.objective}\nAnswer: ${lastAnswer}\nJudge: ${JSON.stringify(judgeResult)}`,
        source: `ELITZE:${response.provider}:${response.model}`,
        confidence: judgeResult.score / 100,
        createdAt: new Date().toISOString(),
      });

      if (judgeResult.decision === 'PASS') {
        return { taskId: task.id, answer: lastAnswer, model: response, judge: judgeResult, attempts: attempt, status: 'COMPLETED' };
      }
    }

    if (!lastModel || !judgeResult) throw new Error('ELITZE produced no evaluated result.');
    return {
      taskId: task.id,
      answer: lastAnswer,
      model: lastModel,
      judge: judgeResult,
      attempts: 3,
      status: judgeResult.decision === 'REVIEW' ? 'REVIEW' : 'FAILED',
    };
  }
}
