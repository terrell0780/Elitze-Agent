import type { ModelAdapter, ModelRequest, ModelResponse } from './types.js';

export type OpenAICompatibleOptions = {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  capabilities?: string[];
};

export class OpenAICompatibleAdapter implements ModelAdapter {
  readonly name: string;
  readonly capabilities: string[];
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly defaultModel: string;

  constructor(options: OpenAICompatibleOptions) {
    this.name = options.name;
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.defaultModel = options.model;
    this.capabilities = options.capabilities ?? ['text', 'reasoning', 'tool-aware'];
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const started = Date.now();
    const headers = new Headers({ 'content-type': 'application/json' });
    if (this.apiKey) headers.set('authorization', `Bearer ${this.apiKey}`);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: request.model ?? this.defaultModel,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 4096,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
      }),
    });

    const body = await response.json().catch(() => null) as any;
    if (!response.ok) {
      throw new Error(`Model request failed (${response.status}): ${body?.error?.message ?? 'unknown error'}`);
    }

    const text = body?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error('Model returned no text content.');

    return {
      text,
      model: body?.model ?? request.model ?? this.defaultModel,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}
