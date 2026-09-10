import test from 'node:test';
import assert from 'node:assert/strict';

const { CapabilityRegistry, LocalMemoryStore, ElitzeModelRouter } = await import('../dist/index.js');

test('memory ranks matching records and drops expired records', async () => {
  const memory = new LocalMemoryStore();
  await memory.put({ id: '1', taskId: 't1', text: 'enterprise sales workflow', source: 'test', confidence: 0.8, createdAt: new Date().toISOString() });
  await memory.put({ id: '2', taskId: 't2', text: 'expired enterprise sales workflow', source: 'test', confidence: 1, createdAt: new Date().toISOString(), expiresAt: '2000-01-01T00:00:00.000Z' });

  const results = await memory.search('enterprise sales');
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1');
});

test('router prefers a model with requested capabilities', () => {
  const basic = { name: 'basic', capabilities: ['text'], generate: async () => ({ text: 'basic', model: 'basic', provider: 'test', latencyMs: 1 }) };
  const reasoning = { name: 'reasoning', capabilities: ['text', 'reasoning'], generate: async () => ({ text: 'reasoning', model: 'reasoning', provider: 'test', latencyMs: 1 }) };
  const router = new ElitzeModelRouter([basic, reasoning]);

  assert.equal(router.select({ id: 't', objective: 'solve this', risk: 'HIGH' }).name, 'reasoning');
});

test('capability registry refuses unconnected capabilities', async () => {
  const registry = new CapabilityRegistry();
  assert.equal(registry.has('agent-reach'), false);
  await assert.rejects(() => registry.invoke('agent-reach', {}), /not connected/);
});
