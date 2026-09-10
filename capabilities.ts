export type CapabilityHandler = (input: unknown) => Promise<unknown>;

export type CapabilityDescriptor = {
  name: string;
  description: string;
  source: string;
};

export class CapabilityRegistry {
  private readonly handlers = new Map<string, CapabilityHandler>();
  private readonly descriptors = new Map<string, CapabilityDescriptor>();

  register(descriptor: CapabilityDescriptor, handler: CapabilityHandler): void {
    const name = descriptor.name.trim().toLowerCase();
    if (!name) throw new Error('Capability name is required.');
    if (!descriptor.source.trim()) throw new Error(`Capability source is required for ${name}.`);
    this.descriptors.set(name, { ...descriptor, name });
    this.handlers.set(name, handler);
  }

  has(name: string): boolean {
    return this.handlers.has(name.trim().toLowerCase());
  }

  list(): CapabilityDescriptor[] {
    return [...this.descriptors.values()].map(descriptor => ({ ...descriptor }));
  }

  async invoke(name: string, input: unknown): Promise<unknown> {
    const key = name.trim().toLowerCase();
    const handler = this.handlers.get(key);
    if (!handler) {
      throw new Error(`Capability '${name}' is not connected. Configure a real handler before invocation.`);
    }
    return handler(input);
  }
}
