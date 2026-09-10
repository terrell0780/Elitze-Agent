import type { ModelAdapter, ModelRequest, ModelResponse } from './types.js';

export type OpenAICompatibleOptions = {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  capabilities?: string[];
  timeoutMs?: number;
};

type ChatCompletionResponse = {
  model?: unknown;
  choices?: Array<{ message?: { content?: unknown } }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    total_tokens?: unknown;
  };
  error?: { message?: unknown };
};

export class OpenAICompatibleAdapter implements ModelAdapter {
  readonly name: string;
  readonly capabilities: string[];
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly defaultModel: string;
  private readonly timeoutMs: number;

  constructor(options: OpenAICompatibleOptions) {
    if (!options.name.trim()) throw new Error('Model adapter name is required.');
    if (!options.baseUrl.trim()) throw new Error('Model adapter baseUrl is required.');
    if (!options.model.trim()) throw new Error('Model adapter model is required.');

    this.name = options.name;
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.defaultModel = options.model;
    this.timeoutMs = Math.max(1_000, options.timeoutMs ?? 120_000);
    this.capabilities = [...new Set(options.capabilities ?? ['text', 'reasoning', 'tool-aware'])];
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers = new Headers({ 'content-type': 'application/json' });
      if (this.apiKey) headers.set('authorization', `Bearer ${this.apiKey}`);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: request.model ?? this.defaultModel,
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxTokens ?? 4096,
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: request.user },
          ],
          ...(request.tools?.length ? { tools: request.tools.map(tool => ({ type: 'function', function: tool })) } : {}),
        }),
      });

      const body = await response.json().catch(() => null) as ChatCompletionResponse | null;
      if (!response.ok) {
        throw new Error(`Model request failed (${response.status}): ${typeof body?.error?.message === 'string' ? body.error.message : 'unknown error'}`);
      }

      const text = body?.choices?.[0]?.message?.content;
      if (typeof text !== 'string' || !text.trim()) throw new Error('Model returned no text content.');

      return {
        text,
        model: typeof body?.model === 'string' ? body.model : request.model ?? this.defaultModel,
        provider: this.name,
        latencyMs: Date.now() - started,
        usage: {
          inputTokens: typeof body?.usage?.prompt_tokens === 'number' ? body.usage.prompt_tokens : undefined,
          outputTokens: typeof body?.usage?.completion_tokens === 'number' ? body.usage.completion_tokens : undefined,
          totalTokens: typeof body?.usage?.total_tokens === 'number' ? body.usage.total_tokens : undefined,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Model request timed out after ${this.timeoutMs}ms.`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
