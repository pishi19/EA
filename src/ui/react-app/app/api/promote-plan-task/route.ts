import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    const { taskDescription, context } = await request.json();

    if (!taskDescription) {
        return NextResponse.json({ message: 'Missing taskDescription' }, { status: 400 });
    }

    try {
        const planPath = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'workstreams', 'roadmap', 'workstream_plan.md');
        let planContent = await fs.readFile(planPath, 'utf-8');
        
        const oraTasksHeader = '### Ora-Suggested Tasks';
        
        const newTask = `
- [ ] ${taskDescription}
  \`added_by: ora\`
  \`context: ${context || 'No context provided.'}\`
`;
        
        if (planContent.includes(oraTasksHeader)) {
            planContent = planContent.replace(oraTasksHeader, `${oraTasksHeader}\n${newTask}`);
        } else {
            // If the header doesn't exist for some reason, append it.
            planContent += `\n---\n\n${oraTasksHeader}\n${newTask}`;
        }

        await fs.writeFile(planPath, planContent, 'utf-8');

        return NextResponse.json({ message: 'Task promoted to plan successfully' });

    } catch (error) {
        console.error('Failed to promote task to plan:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to promote task to plan', error: errorMessage }, { status: 500 });
    }
} 