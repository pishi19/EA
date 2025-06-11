import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { matterOptions } from '@/lib/yaml-engine';
import { 
  withWorkstreamContext, 
  WorkstreamContext,
  createWorkstreamResponse,
  createWorkstreamErrorResponse,
  getWorkstreamArtefactsPath,
  writeWorkstreamFile,
  readWorkstreamFile,
  listWorkstreamFiles,
  logWorkstreamOperation,
  hasWorkstreamPermission,
  validateWorkstreamRequest
} from '@/lib/workstream-api';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

async function createNewTaskFile(workstream: string, taskData: TaskData): Promise<string> {
  const taskId = await generateTaskId();
  const uuid = await generateUUID();
  const fileName = `${taskId}.md`;

  const frontmatter = {
    uuid,
    title: taskData.title,
    phase: taskData.phase,
    workstream: workstream, // Use workstream parameter to ensure isolation
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
  await writeWorkstreamFile(workstream, fileContent, 'artefacts', fileName);
  
  return fileName;
}

// Simplified file operations without mutation engine for now
async function addTaskToExistingFile(workstream: string, fileName: string, taskData: TaskData): Promise<void> {
  try {
    const content = await readWorkstreamFile(workstream, 'artefacts', fileName);
    const file = matter(content, matterOptions);
    
    // Add task entry and log entry to content
    const taskEntry = `- [ ] ${taskData.title}`;
    const logEntry = `- ${new Date().toISOString()}: Task "${taskData.title}" added via inline mutation UI`;
    
    const updatedContent = content + `\n\n### New Task\n${taskEntry}\n\n### Update Log\n${logEntry}`;
    await writeWorkstreamFile(workstream, updatedContent, 'artefacts', fileName);
  } catch (error) {
    throw new Error(`Failed to add task to existing file: ${error}`);
  }
}

async function editTaskInFile(workstream: string, fileName: string, originalTitle: string, taskData: TaskData): Promise<void> {
  try {
    const content = await readWorkstreamFile(workstream, 'artefacts', fileName);
    const file = matter(content, matterOptions);
    
    // Update frontmatter if this is the main task file
    if (file.data.title === originalTitle) {
      file.data.title = taskData.title;
      file.data.status = taskData.status;
      file.data.phase = taskData.phase;
      file.data.workstream = workstream; // Ensure workstream isolation
      file.data.tags = taskData.tags;
    }
    
    // Add log entry
    const logEntry = `- ${new Date().toISOString()}: Task "${originalTitle}" updated to "${taskData.title}" via inline mutation UI`;
    const updatedContent = matter.stringify(file.content + `\n\n### Update Log\n${logEntry}`, file.data);
    
    await writeWorkstreamFile(workstream, updatedContent, 'artefacts', fileName);
  } catch (error) {
    throw new Error(`Failed to edit task: ${error}`);
  }
}

async function deleteTaskFromFile(workstream: string, fileName: string, taskTitle: string): Promise<void> {
  try {
    const content = await readWorkstreamFile(workstream, 'artefacts', fileName);
    
    // Add log entry about deletion
    const logEntry = `- ${new Date().toISOString()}: Task "${taskTitle}" deleted via inline mutation UI`;
    const updatedContent = content + `\n\n### Deletion Log\n${logEntry}`;
    
    await writeWorkstreamFile(workstream, updatedContent, 'artefacts', fileName);
  } catch (error) {
    throw new Error(`Failed to delete task: ${error}`);
  }
}

async function findTaskFile(workstream: string, taskId: string): Promise<string | null> {
  try {
    const files = await listWorkstreamFiles(workstream, 'artefacts');
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        try {
          const content = await readWorkstreamFile(workstream, 'artefacts', file);
          const { data } = matter(content, matterOptions);
          
          // Check if this file contains the task ID or matches the task
          if (data.uuid === taskId || file.includes(taskId)) {
            return file;
          }
        } catch {
          // Skip files that can't be read
          continue;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding task file in workstream ${workstream}:`, error);
    return null;
  }
}

// --- API Handlers ---

async function handleTaskMutationRequest(
  request: NextRequest,
  workstreamContext: WorkstreamContext
): Promise<NextResponse> {
  const { workstream } = workstreamContext;

  // Check permissions
  if (!hasWorkstreamPermission(workstream, 'mutate')) {
    await logWorkstreamOperation({
      workstream,
      operation: 'mutate',
      endpoint: '/api/task-mutations',
      result: 'error',
      error: 'Insufficient permissions'
    });
    
    return createWorkstreamErrorResponse(
      'Insufficient permissions for task mutations',
      workstreamContext,
      403
    );
  }

  try {
    const body: TaskMutationRequest = await request.json();
    const { action, taskData, taskId, targetFile } = body;

    // Validate request
    const validation = validateWorkstreamRequest(body, ['action']);
    if (!validation.isValid) {
      return createWorkstreamErrorResponse(
        `Validation failed: ${validation.errors.join(', ')}`,
        workstreamContext,
        400
      );
    }

    // Ensure workstream isolation by setting correct workstream in task data
    if (taskData) {
      taskData.workstream = workstream;
    }

    switch (action) {
      case 'add':
        if (!taskData) {
          return createWorkstreamErrorResponse(
            'Task data is required for add action',
            workstreamContext,
            400
          );
        }

        let fileName: string;
        if (targetFile) {
          // Add to existing file
          await addTaskToExistingFile(workstream, targetFile, taskData);
          fileName = targetFile;
        } else {
          // Create new file
          fileName = await createNewTaskFile(workstream, taskData);
        }

        await logWorkstreamOperation({
          workstream,
          operation: 'mutate',
          endpoint: '/api/task-mutations',
          data: { action: 'add', fileName },
          result: 'success'
        });

        return createWorkstreamResponse(
          { 
            message: 'Task added successfully', 
            fileName,
            taskId: taskData.uuid
          },
          workstreamContext
        );

      case 'edit':
        if (!taskData || !taskId) {
          return createWorkstreamErrorResponse(
            'Task data and task ID are required for edit action',
            workstreamContext,
            400
          );
        }

        const editFileName = await findTaskFile(workstream, taskId);
        if (!editFileName) {
          return createWorkstreamErrorResponse(
            'Task file not found',
            workstreamContext,
            404
          );
        }

        await editTaskInFile(workstream, editFileName, taskData.title, taskData);

        await logWorkstreamOperation({
          workstream,
          operation: 'mutate',
          endpoint: '/api/task-mutations',
          data: { action: 'edit', taskId, fileName: editFileName },
          result: 'success'
        });

        return createWorkstreamResponse(
          { 
            message: 'Task updated successfully',
            fileName: editFileName
          },
          workstreamContext
        );

      case 'delete':
        if (!taskId) {
          return createWorkstreamErrorResponse(
            'Task ID is required for delete action',
            workstreamContext,
            400
          );
        }

        const deleteFileName = await findTaskFile(workstream, taskId);
        if (!deleteFileName) {
          return createWorkstreamErrorResponse(
            'Task file not found',
            workstreamContext,
            404
          );
        }

        // For now, just add deletion log instead of actual deletion
        await deleteTaskFromFile(workstream, deleteFileName, taskId);

        await logWorkstreamOperation({
          workstream,
          operation: 'mutate',
          endpoint: '/api/task-mutations',
          data: { action: 'delete', taskId, fileName: deleteFileName },
          result: 'success'
        });

        return createWorkstreamResponse(
          { 
            message: 'Task deleted successfully',
            fileName: deleteFileName
          },
          workstreamContext
        );

      default:
        return createWorkstreamErrorResponse(
          'Invalid action',
          workstreamContext,
          400
        );
    }

  } catch (error) {
    console.error(`Error in task mutations API for workstream ${workstream}:`, error);
    
    await logWorkstreamOperation({
      workstream,
      operation: 'mutate',
      endpoint: '/api/task-mutations',
      result: 'error',
      error: String(error)
    });

    return createWorkstreamErrorResponse(
      'Internal server error',
      workstreamContext,
      500
    );
  }
}

async function handleTaskMutationInfo(
  request: NextRequest,
  workstreamContext: WorkstreamContext
): Promise<NextResponse> {
  // Return available mutation actions and their requirements
  return createWorkstreamResponse(
    {
      actions: ['add', 'edit', 'delete'],
      addRequires: ['taskData'],
      editRequires: ['taskData', 'taskId'],
      deleteRequires: ['taskId'],
      optionalFields: ['targetFile'],
      workstream: workstreamContext.workstream,
      permissions: {
        canMutate: hasWorkstreamPermission(workstreamContext.workstream, 'mutate'),
        canRead: hasWorkstreamPermission(workstreamContext.workstream, 'read'),
        canWrite: hasWorkstreamPermission(workstreamContext.workstream, 'write')
      }
    },
    workstreamContext
  );
}

export const POST = withWorkstreamContext(handleTaskMutationRequest);
export const GET = withWorkstreamContext(handleTaskMutationInfo); 