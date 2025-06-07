import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter'; // Using gray-matter to parse frontmatter
import { matterOptions } from '@/lib/yaml-engine';

const BASE_DIR = path.resolve(process.cwd(), '../../..');
const LOOPS_DIR = path.join(BASE_DIR, 'runtime', 'loops');

// Default sections for loop files
const DEFAULT_LOOP_SECTIONS = [
    '## Purpose',
    '## ✅ Objectives',
    '## 🔧 Tasks',
    '## 🧾 Execution Log',
    '## 🧠 Memory Trace'
];

interface ValidationStatus {
  isValid: boolean;
  missingRequiredSections: string[];
  errors: string[];
}

interface SourceLoop {
  uuid: string;
  title: string;
  phase: string | number;
  workstream: string;
  tags: string[];
  validation?: ValidationStatus;
}

interface Task {
  id: string;
  description: string;
  is_complete: boolean;
  source_loop: SourceLoop;
  memory_traces?: MemoryTrace[];
  origin?: string;
}

interface MemoryTrace {
    description: string;
    timestamp: string;
    status: 'completed' | 'executed';
    executor: 'user' | 'system';
    output?: string;
}

function validateLoopSchema(content: string): ValidationStatus {
    const errors: string[] = [];
    const missingRequiredSections: string[] = [];
    
    for (const section of DEFAULT_LOOP_SECTIONS) {
        const regex = new RegExp(`^${section.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'gm');
        const matches = content.match(regex);
        const count = matches ? matches.length : 0;

        if (count === 0) {
            missingRequiredSections.push(section);
            errors.push(`Missing required section: "${section}"`);
        }
    }

    const isValid = errors.length === 0;
    return { isValid, missingRequiredSections, errors };
}

async function parseMarkdownFile(filePath: string): Promise<Task[]> {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data: metadata, content } = matter(fileContent, matterOptions);

        if (!metadata || !metadata.uuid) {
            return [];
        }

        // Validate loop schema
        const validation = validateLoopSchema(content);
        if (!validation.isValid) {
            console.warn(`Schema validation failed for ${filePath}:`, validation.errors);
        }

        // Parse memory traces first
        const memoryTraceRegex = /```json:memory\n([\s\S]*?)\n```/g;
        let traceMatch;
        const allTraces: MemoryTrace[] = [];
        while ((traceMatch = memoryTraceRegex.exec(content)) !== null) {
            try {
                allTraces.push(JSON.parse(traceMatch[1]));
            } catch (error) {
                console.error(`Failed to parse memory trace JSON in ${filePath}:`, error);
            }
        }

        // Parse gpt-suggested tasks from execution log
        const gptTaskRegex = /Task promoted from GPT suggestion: "(.*?)" \(GPT-suggested\)/g;
        let gptMatch;
        const gptTaskDescriptions = new Set();
        while ((gptMatch = gptTaskRegex.exec(content)) !== null) {
            gptTaskDescriptions.add(gptMatch[1]);
        }

        // Parse plan-promoted tasks from execution log
        const planTaskRegex = /Task promoted from workstream_plan.md: "(.*?)" by ora/g;
        let planMatch;
        const planTaskDescriptions = new Set();
        while ((planMatch = planTaskRegex.exec(content)) !== null) {
            planTaskDescriptions.add(planMatch[1]);
        }

        // Extract tasks section
        const tasksHeaderRegex = /## (?:🔧 )?Tasks\n\n([\s\S]*?)(?=\n## |$)/;
        const tasksMatch = content.match(tasksHeaderRegex);
        const tasksContent = tasksMatch ? tasksMatch[1] : '';

        // Parse tasks and attach relevant traces
        const taskRegex = /-\s\[( |x)\]\s(.*)/g;
        let taskMatch;
        const tasks: Task[] = [];
        let taskIndex = 0;

        if (tasksContent) {
            while ((taskMatch = taskRegex.exec(tasksContent)) !== null) {
                const description = taskMatch[2].trim();
                const relevantTraces = allTraces.filter(trace => trace.description === description);
    
                tasks.push({
                    id: `${metadata.uuid}-task-${taskIndex++}`,
                    description: description,
                    is_complete: taskMatch[1].trim() === 'x',
                    source_loop: {
                        uuid: metadata.uuid,
                        title: metadata.title || 'Untitled Loop',
                        phase: metadata.phase || 'N/A',
                        workstream: metadata.workstream || 'unassigned',
                        tags: metadata.tags || [],
                        validation: validation,
                    },
                    memory_traces: relevantTraces.length > 0 ? relevantTraces : undefined,
                    origin: gptTaskDescriptions.has(description) ? 'gpt' : planTaskDescriptions.has(description) ? 'plan' : undefined,
                });
            }
        }
        return tasks;
    } catch (error) {
        console.error(`Error parsing file ${filePath}:`, error);
        return [];
    }
}


export async function GET() {
    try {
        const files = await fs.readdir(LOOPS_DIR);
        const markdownFiles = files.filter(file => file.endsWith('.md'));

        let allTasks: Task[] = [];
        for (const file of markdownFiles) {
            const filePath = path.join(LOOPS_DIR, file);
            const tasksFromFile = await parseMarkdownFile(filePath);
            allTasks = allTasks.concat(tasksFromFile);
        }

        return NextResponse.json(allTasks);
    } catch (error) {
        console.error('Failed to get tasks:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to get tasks', error: errorMessage }, { status: 500 });
    }
} 