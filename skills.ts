import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export type AgentSkill = {
  name: string;
  description: string;
  path: string;
  instructions: string;
};

function parseFrontmatter(text: string): { name?: string; description?: string } {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    result[key] = value;
  }
  return { name: result.name, description: result.description };
}

export class SkillRegistry {
  private readonly skills = new Map<string, AgentSkill>();

  register(skill: AgentSkill): void {
    const name = skill.name.trim().toLowerCase();
    if (!name) throw new Error('Skill name is required.');
    if (!skill.description.trim()) throw new Error(`Skill description is required for '${name}'.`);
    this.skills.set(name, { ...skill, name });
  }

  has(name: string): boolean {
    return this.skills.has(name.trim().toLowerCase());
  }

  get(name: string): AgentSkill | undefined {
    return this.skills.get(name.trim().toLowerCase());
  }

  list(): AgentSkill[] {
    return [...this.skills.values()].map(skill => ({ ...skill }));
  }

  async discover(root: string, maxDepth = 4): Promise<AgentSkill[]> {
    const rootPath = resolve(root);
    const found: AgentSkill[] = [];

    const walk = async (directory: string, depth: number): Promise<void> => {
      if (depth > maxDepth) return;
      let entries;
      try {
        entries = await readdir(directory, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const path = join(directory, entry.name);
        if (!entry.isDirectory()) continue;
        const skillPath = join(path, 'SKILL.md');
        try {
          const source = await readFile(skillPath, 'utf8');
          const metadata = parseFrontmatter(source);
          const name = metadata.name || entry.name;
          const description = metadata.description;
          if (!description) continue;
          const body = source.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '').trim();
          const skill = { name, description, path: skillPath, instructions: body };
          this.register(skill);
          found.push(skill);
        } catch {
          await walk(path, depth + 1);
        }
      }
    };

    await walk(rootPath, 0);
    return found;
  }
}
