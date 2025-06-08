import fs from 'fs/promises';
import path from 'path';

export interface CreateLoopParams {
  uuid: string;
  title: string;
  phase: string;
  workstream: string;
  tags?: string[];
  status?: string;
  created?: string;
  origin?: string;
}

export async function createLoopFile(params: CreateLoopParams): Promise<string> {
  const {
    uuid,
    title,
    phase,
    workstream,
    tags = [],
    status = 'in_progress',
    created = new Date().toISOString(),
    origin = 'gpt'
  } = params;

  // Construct file path
  const baseDir = path.resolve(process.cwd(), '../../../runtime/loops');
  const fileName = `loop-${uuid}.md`;
  const filePath = path.join(baseDir, fileName);

  // Generate frontmatter
  const frontmatter = [
    '---',
    `uuid: ${uuid}`,
    `title: ${title}`,
    `phase: ${phase}`,
    `workstream: ${workstream}`,
    `status: ${status}`,
    `tags: [${tags.join(', ')}]`,
    `created: ${created}`,
    `origin: ${origin}`,
    'summary: |',
    '  ',
    '---'
  ].join('\n');

  // Generate body sections
  const body = [
    '## Purpose',
    '',
    '## ✅ Objectives',
    '',
    '## 🔧 Tasks',
    '',
    '## 🧾 Execution Log',
    '',
    '## 🧠 Memory Trace',
    ''
  ].join('\n');

  const content = `${frontmatter}\n\n${body}`;

  // Ensure directory exists
  await fs.mkdir(baseDir, { recursive: true });

  // Write file
  await fs.writeFile(filePath, content, 'utf-8');

  return filePath;
} 