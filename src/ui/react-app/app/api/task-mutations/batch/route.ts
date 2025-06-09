import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { mutationEngine } from '../../../../../../system/mutation-engine';
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

interface BatchOperation {
  action: 'add' | 'edit' | 'delete';
  taskData?: TaskData;
  taskId?: string;
  targetFile?: string;
  operationId: string; // Unique identifier for this operation
}

interface BatchMutationRequest {
  operations: BatchOperation[];
  undoContext?: {
    previousState: any[];
    operationType: 'batch_mutation';
    timestamp: string;
  };
}

interface BatchResult {
  success: boolean;
  results: {
    operationId: string;
    success: boolean;
    error?: string;
    data?: any;
  }[];
  rollbackData?: any[];
}

// --- Helper Functions from single mutation endpoint ---

async function generateTaskId(): Promise<string> {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function generateUUID(): Promise<string> {
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

- ${new Date().toISOString()}: Task created via batch mutation UI.

## 🧠 Memory Trace

- Created through batch task mutation interface
- Status: ${taskData.status}`;

  const fileContent = matter.stringify(content, frontmatter);
  await fs.writeFile(filePath, fileContent, 'utf-8');
  
  return fileName;
}

async function addTaskToExistingFile(filePath: string, taskData: TaskData): Promise<void> {
  await mutationEngine.validateMarkdownSchema(filePath, ['## 🔢 Tasks', '## 🧾 Execution Log']);
  
  const taskEntry = `- [ ] ${taskData.title}`;
  await mutationEngine.appendToSection(filePath, '## 🔢 Tasks', taskEntry);
  
  const logEntry = `- ${new Date().toISOString()}: Task "${taskData.title}" added via batch mutation UI`;
  await mutationEngine.appendToSection(filePath, '## 🧾 Execution Log', logEntry);
}

async function editTaskInFile(filePath: string, originalTitle: string, taskData: TaskData): Promise<void> {
  const file = await matter(await fs.readFile(filePath, 'utf-8'), matterOptions);
  
  if (file.data.title === originalTitle) {
    await mutationEngine.patchFrontmatter(filePath, {
      title: taskData.title,
      status: taskData.status,
      phase: taskData.phase,
      workstream: taskData.workstream,
      tags: taskData.tags
    });
  }
  
  const taskRegex = new RegExp(`(- \\[[x ]\\] )${originalTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  await mutationEngine.replaceInSection(filePath, '## 🔢 Tasks', taskRegex, `$1${taskData.title}`);
  
  const logEntry = `- ${new Date().toISOString()}: Task "${originalTitle}" updated to "${taskData.title}" via batch mutation UI`;
  await mutationEngine.appendToSection(filePath, '## 🧾 Execution Log', logEntry);
}

async function deleteTaskFromFile(filePath: string, taskTitle: string): Promise<void> {
  const taskRegex = new RegExp(`- \\[[x ]\\] ${taskTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`);
  await mutationEngine.replaceInSection(filePath, '## 🔢 Tasks', taskRegex, '');
  
  const logEntry = `- ${new Date().toISOString()}: Task "${taskTitle}" deleted via batch mutation UI`;
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

// --- Batch Operation Processor ---

async function processBatchOperation(operation: BatchOperation): Promise<{
  operationId: string;
  success: boolean;
  error?: string;
  data?: any;
}> {
  const { action, taskData, taskId, targetFile, operationId } = operation;

  try {
    switch (action) {
      case 'add':
        if (!taskData) {
          return {
            operationId,
            success: false,
            error: 'Task data is required for add action'
          };
        }

        let fileName: string;
        if (targetFile) {
          const filePath = path.join(LOOPS_DIR, targetFile);
          await addTaskToExistingFile(filePath, taskData);
          fileName = targetFile;
        } else {
          fileName = await createNewTaskFile(taskData);
        }

        return {
          operationId,
          success: true,
          data: { 
            fileName,
            taskId: taskData.uuid,
            action: 'add'
          }
        };

      case 'edit':
        if (!taskData || !taskId) {
          return {
            operationId,
            success: false,
            error: 'Task data and task ID are required for edit action'
          };
        }

        const editFilePath = await findTaskFile(taskId);
        if (!editFilePath) {
          return {
            operationId,
            success: false,
            error: 'Task file not found'
          };
        }

        await editTaskInFile(editFilePath, taskData.title, taskData);

        return {
          operationId,
          success: true,
          data: { 
            fileName: path.basename(editFilePath),
            taskId,
            action: 'edit'
          }
        };

      case 'delete':
        if (!taskId) {
          return {
            operationId,
            success: false,
            error: 'Task ID is required for delete action'
          };
        }

        const deleteFilePath = await findTaskFile(taskId);
        if (!deleteFilePath) {
          return {
            operationId,
            success: false,
            error: 'Task file not found'
          };
        }

        if (path.basename(deleteFilePath).startsWith('task-')) {
          await fs.unlink(deleteFilePath);
        } else {
          const fileContent = await fs.readFile(deleteFilePath, 'utf-8');
          const { data } = matter(fileContent, matterOptions);
          await deleteTaskFromFile(deleteFilePath, data.title || taskId);
        }

        return {
          operationId,
          success: true,
          data: { 
            fileName: path.basename(deleteFilePath),
            taskId,
            action: 'delete'
          }
        };

      default:
        return {
          operationId,
          success: false,
          error: 'Invalid action'
        };
    }
  } catch (error) {
    console.error(`Error processing batch operation ${operationId}:`, error);
    return {
      operationId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// --- API Handlers ---

export async function POST(request: Request) {
  try {
    const body: BatchMutationRequest = await request.json();
    const { operations } = body;

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json({ 
        message: 'Operations array is required and must not be empty' 
      }, { status: 400 });
    }

    // Validate operations
    for (const operation of operations) {
      if (!operation.action || !operation.operationId) {
        return NextResponse.json({ 
          message: 'Each operation must have action and operationId' 
        }, { status: 400 });
      }
    }

    // Process all operations
    const results = [];
    let successCount = 0;
    
    for (const operation of operations) {
      const result = await processBatchOperation(operation);
      results.push(result);
      if (result.success) {
        successCount++;
      }
    }

    const overallSuccess = successCount === operations.length;
    const partialSuccess = successCount > 0 && successCount < operations.length;

    // Log batch operation
    const timestamp = new Date().toISOString();
    const logEntry = `Batch mutation: ${successCount}/${operations.length} operations succeeded at ${timestamp}`;
    console.log(logEntry);

    const response: BatchResult = {
      success: overallSuccess,
      results,
      rollbackData: results.filter(r => r.success).map(r => r.data)
    };

    // Add metadata for partial success
    if (partialSuccess) {
      response.success = false; // Overall failure if not all succeeded
    }

    return NextResponse.json(response, { 
      status: overallSuccess ? 200 : (partialSuccess ? 207 : 400) 
    });

  } catch (error) {
    console.error('Error in batch task mutations API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ 
      message: `Failed to process batch mutations: ${errorMessage}` 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return NextResponse.json({
    description: 'Batch task mutations API',
    supportedActions: ['add', 'edit', 'delete'],
    requiredFields: {
      operations: 'Array of batch operations',
      operationId: 'Unique identifier for each operation',
      action: 'add, edit, or delete',
      taskData: 'Required for add/edit operations',
      taskId: 'Required for edit/delete operations'
    },
    responseFormat: {
      success: 'Overall batch success',
      results: 'Array of individual operation results',
      rollbackData: 'Data for undo operations'
    }
  });
} 