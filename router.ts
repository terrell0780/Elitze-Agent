import type { AgentTask, ModelAdapter, ModelRequest, ModelResponse } from './types.js';

export class ElitzeModelRouter {
  constructor(private readonly models: ModelAdapter[]) {
    if (!models.length) throw new Error('ELITZE requires at least one model adapter.');
  }

  select(task: AgentTask): ModelAdapter {
    const risk = task.risk ?? 'MEDIUM';
    const needs = new Set(task.tools ?? []);

    const ranked = this.models.map(model => {
      let score = 0;
      if (needs.has('vision') && model.capabilities.includes('vision')) score += 50;
      if (needs.has('browser') && model.capabilities.includes('browser')) score += 20;
      if (risk === 'HIGH' || risk === 'CRITICAL') {
        if (model.capabilities.includes('reasoning')) score += 25;
        if (model.capabilities.includes('long-context')) score += 20;
      }
      if (task.objective.toLowerCase().includes('code') && model.capabilities.includes('coding')) score += 30;
      return { model, score };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked[0].model;
  }

  async generate(task: AgentTask, request: ModelRequest): Promise<ModelResponse> {
    return this.select(task).generate(request);
  }
}
