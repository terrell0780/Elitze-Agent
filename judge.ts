import type { JudgeDimension, JudgeResult, ModelAdapter, ModelRequest } from './types.js';

const JUDGE_DIMENSIONS: JudgeDimension[] = [
  'CORRECTNESS', 'COMPLETENESS', 'REASONING', 'EVIDENCE', 'SAFETY', 'POLICY', 'TASK_FIT',
];

export class ElitzeFrontierJudge {
  constructor(private readonly judgeModels: ModelAdapter[]) {
    if (!judgeModels.length) throw new Error('ELITZE requires at least one judge model.');
  }

  async evaluate(input: { objective: string; answer: string; context?: string; risk?: string }): Promise<JudgeResult> {
    const request: ModelRequest = {
      system: `You are ELITZE Frontier Judge. Independently evaluate an agent result. Never assume the answer is correct merely because it is confident. Check correctness, completeness, reasoning quality, evidence, safety, policy compliance, and task fit. Return STRICT JSON with: decision (PASS|REVIEW|FAIL), score (0-100), reasons (string[]), dimensions (object with ${JUDGE_DIMENSIONS.join(', ')} each 0-100), requiredRepairs (string[]), evidenceRequired (string[]). High-risk claims without evidence should not receive PASS.`,
      user: JSON.stringify({ objective: input.objective, context: input.context ?? '', risk: input.risk ?? 'MEDIUM', answer: input.answer }),
      temperature: 0,
      maxTokens: 1800,
    };

    const votes = await Promise.all(this.judgeModels.map(model => model.generate(request)));
    const parsed = votes.map(v => this.parse(v.text));
    return this.aggregate(parsed);
  }

  private parse(text: string): JudgeResult {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) return this.fail('Judge did not return parseable JSON.');
    try {
      const raw = JSON.parse(text.slice(start, end + 1));
      const dim = Object.fromEntries(JUDGE_DIMENSIONS.map(d => [d, Number(raw?.dimensions?.[d] ?? 0)])) as Record<JudgeDimension, number>;
      return {
        decision: raw.decision === 'PASS' || raw.decision === 'FAIL' ? raw.decision : 'REVIEW',
        score: Number.isFinite(raw.score) ? Math.max(0, Math.min(100, Number(raw.score))) : 0,
        reasons: Array.isArray(raw.reasons) ? raw.reasons.map(String) : ['Missing judge reasons.'],
        dimensions: dim,
        requiredRepairs: Array.isArray(raw.requiredRepairs) ? raw.requiredRepairs.map(String) : [],
        evidenceRequired: Array.isArray(raw.evidenceRequired) ? raw.evidenceRequired.map(String) : [],
      };
    } catch {
      return this.fail('Judge JSON could not be parsed.');
    }
  }

  private aggregate(results: JudgeResult[]): JudgeResult {
    const score = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
    const dimensions = Object.fromEntries(JUDGE_DIMENSIONS.map(d => [d, Math.round(results.reduce((sum, r) => sum + r.dimensions[d], 0) / results.length)])) as Record<JudgeDimension, number>;
    const reasons = [...new Set(results.flatMap(r => r.reasons))].slice(0, 20);
    const repairs = [...new Set(results.flatMap(r => r.requiredRepairs))].slice(0, 20);
    const evidence = [...new Set(results.flatMap(r => r.evidenceRequired))].slice(0, 20);
    const anyFail = results.some(r => r.decision === 'FAIL');
    const allPass = results.every(r => r.decision === 'PASS');
    const decision = anyFail || score < 50 ? 'FAIL' : allPass && score >= 80 && dimensions.SAFETY >= 80 && dimensions.POLICY >= 80 ? 'PASS' : 'REVIEW';
    return { decision, score, reasons, dimensions, requiredRepairs: repairs, evidenceRequired: evidence };
  }

  private fail(reason: string): JudgeResult {
    return {
      decision: 'FAIL', score: 0, reasons: [reason], requiredRepairs: ['Retry with a valid structured judge response.'], evidenceRequired: ['Independent evaluation output'],
      dimensions: Object.fromEntries(JUDGE_DIMENSIONS.map(d => [d, 0])) as Record<JudgeDimension, number>,
    };
  }
}
