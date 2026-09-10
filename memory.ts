export type MemoryRecord = {
  id: string;
  taskId: string;
  text: string;
  source: string;
  confidence: number | null;
  createdAt: string;
  expiresAt?: string;
};

export interface MemoryStore {
  put(record: MemoryRecord): Promise<void>;
  search(query: string, limit?: number): Promise<MemoryRecord[]>;
}

export class LocalMemoryStore implements MemoryStore {
  private readonly records: MemoryRecord[] = [];

  async put(record: MemoryRecord) { this.records.push(record); }

  async search(query: string, limit = 8) {
    const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);
    const scored = this.records.map(record => {
      const haystack = record.text.toLowerCase();
      const score = tokens.reduce((n, token) => n + (haystack.includes(token) ? 1 : 0), 0);
      return { record, score };
    });
    return scored.filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(x => x.record);
  }
}
