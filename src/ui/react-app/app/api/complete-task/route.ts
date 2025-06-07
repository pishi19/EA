import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';

function runEmbeddingScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(process.cwd(), '..', '..', 'scripts', 'update_qdrant_embeddings.py');
        const command = `python ${scriptPath}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return reject(new Error(`Failed to execute embedding script: ${stderr}`));
            }
            console.log(`stdout: ${stdout}`);
            resolve();
        });
    });
}

async function appendToMemoryTrace(loopFilePath: string, trace: string) {
    let fileContent = await fs.readFile(loopFilePath, 'utf-8');
    const memoryTraceHeader = '## 🧠 Memory Trace';
    
    if (fileContent.includes(memoryTraceHeader)) {
        fileContent = fileContent.replace(memoryTraceHeader, `${memoryTraceHeader}\n\n${trace}`);
    } else {
        fileContent += `\n\n${memoryTraceHeader}\n\n${trace}`;
    }

    await fs.writeFile(loopFilePath, fileContent, 'utf-8');
}

export async function POST(request: Request) {
  try {
    const { loopId, taskDescription } = await request.json();

    if (!loopId || !taskDescription) {
      return NextResponse.json({ message: 'Missing loopId or taskDescription' }, { status: 400 });
    }

    const loopFilePath = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'loops', `${loopId}.md`);
    
    let fileContent = await fs.readFile(loopFilePath, 'utf-8');

    const checklistRegex = new RegExp(`(- \\[ \\]) (${escapeRegExp(taskDescription)})`, 'g');
    if (!checklistRegex.test(fileContent)) {
        return NextResponse.json({ message: 'Task not found in a checklist' }, { status: 404 });
    }

    fileContent = fileContent.replace(checklistRegex, `- [x] $2`);
    
    const timestamp = new Date().toISOString();
    const logEntry = `- ${timestamp}: Task “${taskDescription}” marked complete via UI`;

    const executionLogHeader = '## 🧾 Execution Log';
    const logHeaderIndex = fileContent.indexOf(executionLogHeader);
    
    if (logHeaderIndex !== -1) {
      const endOfLogSection = fileContent.indexOf('##', logHeaderIndex + executionLogHeader.length);
      const insertionPoint = endOfLogSection !== -1 ? endOfLogSection : fileContent.length;
      
      const before = fileContent.substring(0, insertionPoint);
      const after = fileContent.substring(insertionPoint);

      fileContent = `${before.trim()}\n\n${logEntry}\n\n${after.trim()}`;
    } else {
      fileContent += `\n\n${executionLogHeader}\n\n${logEntry}`;
    }

    await fs.writeFile(loopFilePath, fileContent, 'utf-8');

    const memoryTrace = `\`\`\`json:memory
{
  "description": "${taskDescription}",
  "timestamp": "${timestamp}",
  "status": "completed",
  "executor": "user"
}
\`\`\``;
    await appendToMemoryTrace(loopFilePath, memoryTrace);

    // Optionally run the Qdrant update script
    runEmbeddingScript().catch(err => {
        console.error("Failed to update Qdrant embeddings:", err);
        // We don't want to fail the whole request if this optional step fails
    });

    return NextResponse.json({ message: 'Task marked as complete' });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: 'Failed to complete task', error: errorMessage }, { status: 500 });
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
} 