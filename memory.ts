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

  async put(record: MemoryRecord): Promise<void> {
    const normalized = {
      ...record,
      confidence: record.confidence == null ? null : Math.max(0, Math.min(1, record.confidence)),
    };
    this.records.push(normalized);
  }

  async search(query: string, limit = 8): Promise<MemoryRecord[]> {
    if (limit <= 0) return [];

    const now = Date.now();
    const tokens = [...new Set(query.toLowerCase().split(/\W+/).filter(Boolean))];
    if (!tokens.length) return [];

    const scored = this.records
      .filter(record => !record.expiresAt || Number.isNaN(Date.parse(record.expiresAt)) || Date.parse(record.expiresAt) > now)
      .map(record => {
        const haystack = record.text.toLowerCase();
        const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
        return { record, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const bConfidence = b.record.confidence ?? 0;
        const aConfidence = a.record.confidence ?? 0;
        if (bConfidence !== aConfidence) return bConfidence - aConfidence;
        return Date.parse(b.record.createdAt) - Date.parse(a.record.createdAt);
      });

    return scored.slice(0, limit).map(item => item.record);
  }
}
