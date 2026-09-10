export type GodsEyeLayer =
  | 'WORLD'
  | 'WEB'
  | 'ORGANIZATION'
  | 'APPLICATIONS'
  | 'AGENTS'
  | 'TOOLS'
  | 'MODELS'
  | 'DATA'
  | 'SECURITY'
  | 'EXECUTION';

export type GodsEyeEvidenceKind = 'OBSERVED' | 'INFERRED' | 'USER_PROVIDED' | 'EXTERNAL';

export type GodsEyeNode = {
  id: string;
  label: string;
  layer: GodsEyeLayer;
  kind?: string;
  status?: 'UNKNOWN' | 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'ALERT';
  evidence: GodsEyeEvidenceKind;
  source?: string;
  observedAt: string;
  confidence?: number;
  metadata?: Record<string, string>;
};

export type GodsEyeEdge = {
  source: string;
  target: string;
  relation: string;
  evidence: GodsEyeEvidenceKind;
  confidence?: number;
};

export type GodsEyeAlert = {
  id: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  nodeIds: string[];
  source?: string;
  observedAt: string;
};

export type GodsEyeSnapshot = {
  capturedAt: string;
  scope: string;
  layers: GodsEyeLayer[];
  nodes: GodsEyeNode[];
  edges: GodsEyeEdge[];
  alerts: GodsEyeAlert[];
};

export type GodsEyeSource = {
  name: string;
  layers: GodsEyeLayer[];
  collect: (scope: string) => Promise<Pick<GodsEyeSnapshot, 'nodes' | 'edges' | 'alerts'>>;
};

export class GodsEye {
  private readonly sources = new Map<string, GodsEyeSource>();

  register(source: GodsEyeSource): void {
    const name = source.name.trim();
    if (!name) throw new Error('Gods Eye source name is required.');
    if (!source.layers.length) throw new Error(`Gods Eye source '${name}' must declare at least one layer.`);
    this.sources.set(name.toLowerCase(), source);
  }

  listSources(): GodsEyeSource[] {
    return [...this.sources.values()];
  }

  async observe(scope: string, now = new Date().toISOString()): Promise<GodsEyeSnapshot> {
    if (!scope.trim()) throw new Error('Gods Eye scope is required.');
    const results = await Promise.all(
      [...this.sources.values()].map(async source => {
        const result = await source.collect(scope);
        return { source, result };
      }),
    );

    const nodes = results.flatMap(({ result }) => result.nodes);
    const edges = results.flatMap(({ result }) => result.edges);
    const alerts = results.flatMap(({ result }) => result.alerts);
    const layers = [...new Set(results.flatMap(({ source }) => source.layers))];

    return { capturedAt: now, scope, layers, nodes, edges, alerts };
  }
}
