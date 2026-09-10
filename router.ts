import type { AgentTask, ModelAdapter, ModelRequest, ModelResponse } from './types.js';

export class ElitzeModelRouter {
  constructor(private readonly models: ModelAdapter[]) {
    if (!models.length) throw new Error('ELITZE requires at least one model adapter.');
  }

  list(): readonly ModelAdapter[] {
    return this.models;
  }

  select(task: AgentTask): ModelAdapter {
    const risk = task.risk ?? 'MEDIUM';
    const needs = new Set((task.tools ?? []).map(value => value.toLowerCase()));
    const objective = task.objective.toLowerCase();

    const ranked = this.models.map((model, index) => {
      const capabilities = new Set(model.capabilities.map(value => value.toLowerCase()));
      let score = 0;

      for (const need of needs) {
        if (capabilities.has(need)) score += 25;
      }

      if ((risk === 'HIGH' || risk === 'CRITICAL') && capabilities.has('reasoning')) score += 25;
      if ((risk === 'HIGH' || risk === 'CRITICAL') && capabilities.has('long-context')) score += 20;
      if (/\b(code|coding|debug|program|repository)\b/.test(objective) && capabilities.has('coding')) score += 30;
      if (/\b(image|vision|screenshot|visual)\b/.test(objective) && capabilities.has('vision')) score += 30;
      if (needs.has('browser') && capabilities.has('browser')) score += 25;

      return { model, score, index };
    });

    ranked.sort((a, b) => b.score - a.score || a.index - b.index);
    const selected = ranked[0]?.model;
    if (!selected) throw new Error('ELITZE could not select a model adapter.');
    return selected;
  }

  async generate(task: AgentTask, request: ModelRequest): Promise<ModelResponse> {
    const preferred = this.select(task);
    const ordered = [preferred, ...this.models.filter(model => model !== preferred)];
    let lastError: unknown;

    for (const model of ordered) {
      try {
        return await model.generate(request);
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(`All ELITZE model adapters failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
  }
}
