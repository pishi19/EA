import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { mutationEngine } from '@/system/mutation-engine';
import { Task } from '@/lib/types';
import { parsePlan, stringifyPlan } from '@/lib/plan-parser';
import { logTaskInteraction } from '@/lib/interaction-logger';

// --- Constants ---
const WORKSTREAM_PLAN_PATH = path.resolve(process.cwd(), '../../../runtime/workstreams/roadmap/workstream_plan.md');
const LOOPS_DIR = path.resolve(process.cwd(), '../../../runtime/loops');
const WORKSTREAMS_DIR = path.resolve(process.cwd(), '../../../runtime/workstreams');


// --- API Handler ---
export async function POST(request: Request) {
    const { task, destinationType, destinationId } = await request.json();

    if (!task || !destinationType || !destinationId) {
        return NextResponse.json({ message: 'Missing required parameters: task, destinationType, and destinationId are required.' }, { status: 400 });
    }

    try {
        let targetFilePath: string;
        let destinationIdentifier = destinationId;
        
        switch (destinationType) {
            case 'new-loop':
                const newLoopFileName = `${destinationId}.md`;
                targetFilePath = path.join(LOOPS_DIR, newLoopFileName);
                destinationIdentifier = newLoopFileName;
                
                // Create the new loop file with required sections before promoting
                const initialContent = `---
id: ${destinationId}
name: ${destinationId}
status: active
---

## 🎯 Goal
...

## 🔧 Tasks

## 🧾 Execution Log
`;
                await fs.writeFile(targetFilePath, initialContent, 'utf-8');
                break;
            case 'existing-loop':
                // Assuming destinationId is the filename like 'loop-xyz.md'
                targetFilePath = path.join(LOOPS_DIR, destinationId);
                destinationIdentifier = destinationId;
                break;
            case 'project-task-file':
                // destinationId is the relative path from WORKSTREAMS_DIR
                targetFilePath = path.join(WORKSTREAMS_DIR, destinationId);
                destinationIdentifier = destinationId;
                break;
            default:
                return NextResponse.json({ message: `Unsupported destination type: ${destinationType}` }, { status: 400 });
        }
        
        // 1. Validate the target file schema
        await mutationEngine.validateMarkdownSchema(targetFilePath, ['## 🔧 Tasks', '## 🧾 Execution Log']);

        // 2. Append the task and log to the target file using the engine
        const taskEntry = `- [ ] ${task.description}`;
        const logEntry = `- ${new Date().toISOString()}: Task "${task.description}" promoted from workstream_plan.md by user`;
        
        await mutationEngine.appendToSection(targetFilePath, '## 🔧 Tasks', taskEntry, task.id);
        await mutationEngine.appendToSection(targetFilePath, '## 🧾 Execution Log', logEntry, task.id);

        // 3. Update the workstream_plan.md using the engine
        const planContent = await fs.readFile(WORKSTREAM_PLAN_PATH, 'utf-8');
        const planTasks = parsePlan(planContent);
        const taskIndex = planTasks.findIndex(t => t.id === task.id);

        if (taskIndex !== -1) {
            const originalTaskString = stringifyPlan([planTasks[taskIndex]], ''); // A bit of a hack to get the string for one task
            
            planTasks[taskIndex].status = 'promoted';
            planTasks[taskIndex].promoted_to = destinationIdentifier;
            
            const updatedTaskString = stringifyPlan([planTasks[taskIndex]], '');

            await mutationEngine.replaceInSection(WORKSTREAM_PLAN_PATH, '### User-Defined Tasks', originalTaskString, updatedTaskString, task.id);
            await mutationEngine.replaceInSection(WORKSTREAM_PLAN_PATH, '### Ora-Suggested Tasks', originalTaskString, updatedTaskString, task.id);

        } else {
             return NextResponse.json({ message: 'Task not found in workstream plan' }, { status: 404 });
        }
        
        // Log the interaction
        try {
            await logTaskInteraction(
                'promote',
                task.description,
                'user', // Assume user promotes tasks through UI
                `Task successfully promoted to ${destinationType}: ${destinationIdentifier}`,
                task.id
            );
        } catch (logError) {
            console.error('Failed to log task promotion interaction:', logError);
        }
        
        return NextResponse.json({ message: 'Task promoted successfully', promoted_to: destinationIdentifier });

    } catch (error) {
        console.error('Failed to promote task:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: `Failed to promote task: ${errorMessage}` }, { status: 500 });
    }
} 