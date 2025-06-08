import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { parsePlan, stringifyPlan, Task } from '@/lib/plan-parser';
import { mutationEngine } from '@/system/mutation-engine';
import { logTaskInteraction } from '@/lib/interaction-logger';

export const dynamic = 'force-dynamic';

const BASE_DIR = path.resolve(process.cwd(), '../../..');
const PLAN_PATH = path.join(BASE_DIR, 'runtime', 'workstreams', 'roadmap', 'workstream_plan.md');
const BACKUP_DIR = path.join(BASE_DIR, 'runtime', 'backups');

async function safeWriteTasks(tasks: Task[], existingContent: string) {
    // 1. Create a backup
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(BACKUP_DIR, `workstream_plan.md.${timestamp}.bak`);
    await fs.copyFile(PLAN_PATH, backupPath);

    // 2. Perform a sanity check before writing
    const originalTasks = parsePlan(existingContent);
    if (originalTasks.length > 5 && tasks.length < originalTasks.length / 2) {
        throw new Error(`Potential data loss detected. Aborting write. Original tasks: ${originalTasks.length}, New tasks: ${tasks.length}`);
    }

    // 3. Write the new content
    const newContent = stringifyPlan(tasks, existingContent);
    await fs.writeFile(PLAN_PATH, newContent, 'utf-8');
}

export async function GET() {
    try {
        const planContent = await fs.readFile(PLAN_PATH, 'utf-8');
        const tasks = parsePlan(planContent);
        return NextResponse.json(tasks);
    } catch (error) {
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json([]);
        }
        console.error('Failed to get plan tasks:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to get plan tasks', error: errorMessage }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { description, added_by, context } = body;
        
        if (!description || !added_by) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }
        
        const sectionHeader = added_by === 'user' ? '### User-Defined Tasks' : '### Ora-Suggested Tasks';
        
        const newTask: Omit<Task, 'id' | 'section'> = {
            description,
            added_by,
            status: 'pending',
            source: `plan: ${path.basename(PLAN_PATH)}`,
            context,
        };
        
        const taskString = stringifyPlan([{...newTask, id: '', section: 'User-Defined Tasks' }], ''); // Create the string representation
        
        await mutationEngine.appendToSection(PLAN_PATH, sectionHeader, taskString);
        
        // Log the interaction
        try {
            await logTaskInteraction(
                'create',
                newTask.description,
                newTask.added_by,
                `Task successfully created and added to ${sectionHeader}.`,
                context
            );
        } catch (logError) {
            console.error('Failed to log task creation interaction:', logError);
        }
        
        return NextResponse.json(newTask, { status: 201 });
        
    } catch (error) {
        console.error('Failed to add task:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to add task', error: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const taskToUpdate: Task = await request.json();
        
        const fileContent = await fs.readFile(PLAN_PATH, 'utf-8');
        const tasks = parsePlan(fileContent);
        
        const originalTask = tasks.find(t => t.id === taskToUpdate.id);
        if (!originalTask) {
            return NextResponse.json({ message: 'Task not found' }, { status: 404 });
        }

        const originalTaskString = stringifyPlan([originalTask], '');
        const updatedTaskString = stringifyPlan([taskToUpdate], '');
        
        const sectionHeader = taskToUpdate.section === 'User-Defined Tasks' ? '### User-Defined Tasks' : '### Ora-Suggested Tasks';

        await mutationEngine.replaceInSection(PLAN_PATH, sectionHeader, originalTaskString, updatedTaskString, taskToUpdate.id);

        // Log the interaction
        try {
            await logTaskInteraction(
                'update',
                taskToUpdate.description,
                'user', // Assume user updates tasks through UI
                `Task successfully updated in ${sectionHeader}.`,
                taskToUpdate.id
            );
        } catch (logError) {
            console.error('Failed to log task update interaction:', logError);
        }

        return NextResponse.json(taskToUpdate);

    } catch (error) {
        console.error('Failed to update task:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to update task', error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ message: 'Missing task id' }, { status: 400 });
        
        const fileContent = await fs.readFile(PLAN_PATH, 'utf-8');
        const tasks = parsePlan(fileContent);
        
        const taskToDelete = tasks.find(t => t.id === id);
        if (!taskToDelete) {
             return NextResponse.json({ message: 'Task not found' }, { status: 404 });
        }
        
        const taskString = stringifyPlan([taskToDelete], '');
        const sectionHeader = taskToDelete.section === 'User-Defined Tasks' ? '### User-Defined Tasks' : '### Ora-Suggested Tasks';

        await mutationEngine.replaceInSection(PLAN_PATH, sectionHeader, taskString, '', id);

        // Log the interaction
        try {
            await logTaskInteraction(
                'delete',
                taskToDelete.description,
                'user', // Assume user deletes tasks through UI
                `Task successfully deleted from ${sectionHeader}.`,
                id
            );
        } catch (logError) {
            console.error('Failed to log task deletion interaction:', logError);
        }

        return NextResponse.json({ message: 'Task deleted successfully' });
        
    } catch (error) {
        console.error('Failed to delete task:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to delete task', error: errorMessage }, { status: 500 });
    }
} 