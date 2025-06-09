import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { mutationEngine } from '../../../../../system/mutation-engine';
import { matterOptions } from '@/lib/yaml-engine';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// --- Path Resolution ---
const BASE_DIR = path.resolve(process.cwd(), '../../..');
const LOOPS_DIR = path.join(BASE_DIR, 'runtime/loops');

interface TaskData {
  id?: string;
  title: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'complete' | 'blocked';
  phase: string;
  workstream: string;
  tags: string[];
  uuid?: string;
}

interface TaskMutationRequest {
  action: 'add' | 'edit' | 'delete';
  taskData?: TaskData;
  taskId?: string;
  targetFile?: string; // Optional: specify target file for adding tasks
}

// --- Helper Functions ---

async function generateTaskId(): Promise<string> {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function generateUUID(): Promise<string> {
  // Simple UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createNewTaskFile(taskData: TaskData): Promise<string> {
  const taskId = await generateTaskId();
  const uuid = await generateUUID();
  const fileName = `${taskId}.md`;
  const filePath = path.join(LOOPS_DIR, fileName);

  const frontmatter = {
    uuid,
    title: taskData.title,
    phase: taskData.phase,
    workstream: taskData.workstream,
    status: taskData.status,
    type: 'execution',
    tags: taskData.tags,
    score: 0,
    created: new Date().toISOString().split('T')[0]
  };

  const content = `## ✅ Objectives

${taskData.description || 'Task objectives to be defined.'}

## 🔢 Tasks

- [ ] ${taskData.title}

## 🧾 Execution Log

- ${new Date().toISOString()}: Task created via inline mutation UI.

## 🧠 Memory Trace

- Created through inline task mutation interface
- Status: ${taskData.status}`;

  const fileContent = matter.stringify(content, frontmatter);
  await fs.writeFile(filePath, fileContent, 'utf-8');
  
  return fileName;
}

async function addTaskToExistingFile(filePath: string, taskData: TaskData): Promise<void> {
  // Validate the file has required sections
  await mutationEngine.validateMarkdownSchema(filePath, ['## 🔢 Tasks', '## 🧾 Execution Log']);
  
  // Add task entry
  const taskEntry = `- [ ] ${taskData.title}`;
  await mutationEngine.appendToSection(filePath, '## 🔢 Tasks', taskEntry);
  
  // Add log entry
  const logEntry = `- ${new Date().toISOString()}: Task "${taskData.title}" added via inline mutation UI`;
  await mutationEngine.appendToSection(filePath, '## 🧾 Execution Log', logEntry);
}

async function editTaskInFile(filePath: string, originalTitle: string, taskData: TaskData): Promise<void> {
  const file = await matter(await fs.readFile(filePath, 'utf-8'), matterOptions);
  
  // Update frontmatter if this is the main task file
  if (file.data.title === originalTitle) {
    await mutationEngine.patchFrontmatter(filePath, {
      title: taskData.title,
      status: taskData.status,
      phase: taskData.phase,
      workstream: taskData.workstream,
      tags: taskData.tags
    });
  }
  
  // Update task in Tasks section
  const taskRegex = new RegExp(`(- \\[[x ]\\] )${originalTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  await mutationEngine.replaceInSection(filePath, '## 🔢 Tasks', taskRegex, `$1${taskData.title}`);
  
  // Add log entry
  const logEntry = `- ${new Date().toISOString()}: Task "${originalTitle}" updated to "${taskData.title}" via inline mutation UI`;
  await mutationEngine.appendToSection(filePath, '## 🧾 Execution Log', logEntry);
}

async function deleteTaskFromFile(filePath: string, taskTitle: string): Promise<void> {
  // Remove task from Tasks section
  const taskRegex = new RegExp(`- \\[[x ]\\] ${taskTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`);
  await mutationEngine.replaceInSection(filePath, '## 🔢 Tasks', taskRegex, '');
  
  // Add log entry
  const logEntry = `- ${new Date().toISOString()}: Task "${taskTitle}" deleted via inline mutation UI`;
  await mutationEngine.appendToSection(filePath, '## 🧾 Execution Log', logEntry);
}

async function findTaskFile(taskId: string): Promise<string | null> {
  try {
    const files = await fs.readdir(LOOPS_DIR);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(LOOPS_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(fileContent, matterOptions);
        
        // Check if this file contains the task ID or matches the task
        if (data.uuid === taskId || file.includes(taskId)) {
          return filePath;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding task file:', error);
    return null;
  }
}

// --- API Handlers ---

export async function POST(request: Request) {
  try {
    const body: TaskMutationRequest = await request.json();
    const { action, taskData, taskId, targetFile } = body;

    if (!action) {
      return NextResponse.json({ message: 'Action is required' }, { status: 400 });
    }

    switch (action) {
      case 'add':
        if (!taskData) {
          return NextResponse.json({ message: 'Task data is required for add action' }, { status: 400 });
        }

        let fileName: string;
        if (targetFile) {
          // Add to existing file
          const filePath = path.join(LOOPS_DIR, targetFile);
          await addTaskToExistingFile(filePath, taskData);
          fileName = targetFile;
        } else {
          // Create new file
          fileName = await createNewTaskFile(taskData);
        }

        return NextResponse.json({ 
          message: 'Task added successfully', 
          fileName,
          taskId: taskData.uuid
        });

      case 'edit':
        if (!taskData || !taskId) {
          return NextResponse.json({ message: 'Task data and task ID are required for edit action' }, { status: 400 });
        }

        const editFilePath = await findTaskFile(taskId);
        if (!editFilePath) {
          return NextResponse.json({ message: 'Task file not found' }, { status: 404 });
        }

        // We need the original title to find and replace the task
        // For now, we'll use the task ID as a fallback
        await editTaskInFile(editFilePath, taskData.title, taskData);

        return NextResponse.json({ 
          message: 'Task updated successfully',
          fileName: path.basename(editFilePath)
        });

      case 'delete':
        if (!taskId) {
          return NextResponse.json({ message: 'Task ID is required for delete action' }, { status: 400 });
        }

        const deleteFilePath = await findTaskFile(taskId);
        if (!deleteFilePath) {
          return NextResponse.json({ message: 'Task file not found' }, { status: 404 });
        }

        // If this is a standalone task file, delete the entire file
        if (path.basename(deleteFilePath).startsWith('task-')) {
          await fs.unlink(deleteFilePath);
        } else {
          // Remove task from existing file
          const fileContent = await fs.readFile(deleteFilePath, 'utf-8');
          const { data } = matter(fileContent, matterOptions);
          await deleteTaskFromFile(deleteFilePath, data.title || taskId);
        }

        return NextResponse.json({ 
          message: 'Task deleted successfully',
          fileName: path.basename(deleteFilePath)
        });

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in task mutations API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message: `Failed to process task mutation: ${errorMessage}` }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Return available mutation actions and their requirements
  return NextResponse.json({
    actions: ['add', 'edit', 'delete'],
    addRequires: ['taskData'],
    editRequires: ['taskData', 'taskId'],
    deleteRequires: ['taskId'],
    optionalFields: ['targetFile']
  });
} 