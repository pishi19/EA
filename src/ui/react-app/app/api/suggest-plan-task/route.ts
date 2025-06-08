import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Function to parse tasks from the workstream plan
function parseWorkstreamPlan(content: string): string[] {
    const tasks: string[] = [];
    const taskRegex = /-\s\[\s\]\s(.*?)\n\s+`added_by:/g;
    let match;
    while ((match = taskRegex.exec(content)) !== null) {
        tasks.push(match[1].trim());
    }
    return tasks;
}

export async function POST(request: Request) {
    const { loopId } = await request.json();

    if (!loopId) {
        return NextResponse.json({ message: 'Missing loopId' }, { status: 400 });
    }

    try {
        // 1. Read the workstream plan
        const planPath = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'workstreams', 'roadmap', 'workstream_plan.md');
        const planContent = await fs.readFile(planPath, 'utf-8');
        const openTasks = parseWorkstreamPlan(planContent);

        // 2. Read the source loop file for context
        const loopFilePath = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'loops', `${loopId}.md`);
        const loopFileContent = await fs.readFile(loopFilePath, 'utf-8');
        const { data: loopMetadata, content: loopBody } = matter(loopFileContent);

        // 3. Construct the prompt
        const prompt = `
            Given the following context from a system loop and the list of open tasks from the master workstream plan, suggest the next task.

            **Loop Context:**
            - Title: ${loopMetadata.title}
            - Summary: ${loopMetadata.summary}
            
            **Existing Open Tasks in Plan:**
            ${openTasks.map(t => `- ${t}`).join('\n')}

            **Instructions:**
            1.  Review the loop context and the list of open tasks.
            2.  Do not suggest a task that is already on the list.
            3.  If your suggestion is a refinement or sub-task of an existing task, state which one it relates to.
            4.  If it is a new task, it must be justified by the loop context. Provide a one-sentence justification in a 'context' field.
            5.  The suggestion should be a single, actionable task.

            Provide your output in JSON format with the following structure:
            {
                "type": "new" | "refinement",
                "task_description": "The suggested task.",
                "parent_task": "The parent task if type is refinement, otherwise null.",
                "context": "Justification for a new task, otherwise null."
            }
        `;
        
        // --- Mocking GPT response for now ---
        const mockGptResponse = {
            "type": "new",
            "task_description": "Create a visual representation of the roadmap lineage in the System View",
            "parent_task": null,
            "context": "The System View currently lacks a clear visual guide for phase progression, which is a key objective."
        };
        
        console.log("Generated Prompt:", prompt);

        return NextResponse.json(mockGptResponse);

    } catch (error) {
        console.error('Failed to get plan suggestion:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to get plan suggestion', error: errorMessage }, { status: 500 });
    }
} 