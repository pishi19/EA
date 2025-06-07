import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

async function appendToExecutionLog(loopFilePath: string, logEntry: string) {
    let fileContent = await fs.readFile(loopFilePath, 'utf-8');
    const executionLogHeader = '## 🧾 Execution Log';
    const logHeaderIndex = fileContent.indexOf(executionLogHeader);
    
    if (logHeaderIndex !== -1) {
        // Find the end of the execution log section to append the new log
        const endOfLogSection = fileContent.indexOf('\n##', logHeaderIndex + 1) || fileContent.length;
        const before = fileContent.substring(0, endOfLogSection);
        const after = fileContent.substring(endOfLogSection);
        fileContent = `${before.trim()}\n${logEntry}\n\n${after.trim()}`;
    } else {
        // If no log section, append it to the end
        fileContent = `${fileContent.trim()}\n\n${executionLogHeader}\n\n${logEntry}`;
    }

    await fs.writeFile(loopFilePath, fileContent, 'utf-8');
}

async function appendToMemoryTrace(loopFilePath: string, trace: string) {
    let fileContent = await fs.readFile(loopFilePath, 'utf-8');
    const memoryTraceHeader = '## 🧠 Memory Trace';
    
    if (fileContent.includes(memoryTraceHeader)) {
        fileContent = fileContent.replace(memoryTraceHeader, `${memoryTraceHeader}\n\n${trace}`);
    } else {
        fileContent = `${fileContent.trim()}\n\n${memoryTraceHeader}\n\n${trace}`;
    }

    await fs.writeFile(loopFilePath, fileContent, 'utf-8');
}


export async function POST(request: Request) {
  try {
    const { loopId, taskDescription, loopTitle } = await request.json();

    if (!loopId || !taskDescription || !loopTitle) {
      return NextResponse.json({ message: 'Missing loopId, taskDescription, or loopTitle' }, { status: 400 });
    }
    
    // Simulate GPT call
    const simulatedGptReasoning = `Simulated reasoning for task "${taskDescription}" in loop "${loopTitle}". The plan is to execute the following steps...`;

    const loopFilePath = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'loops', `${loopId}.md`);
    const timestamp = new Date().toISOString();
    const logEntry = `- ${timestamp}: Task “${taskDescription}” run via UI. Reasoning: ${simulatedGptReasoning}`;

    await appendToExecutionLog(loopFilePath, logEntry);
    
    const memoryTrace = `\`\`\`json:memory
{
  "description": "${taskDescription}",
  "timestamp": "${timestamp}",
  "status": "executed",
  "executor": "system",
  "output": "${simulatedGptReasoning}"
}
\`\`\``;
    await appendToMemoryTrace(loopFilePath, memoryTrace);

    // Return the reasoning to be displayed in the UI
    return NextResponse.json({ result: simulatedGptReasoning });
  } catch (error) {
    console.error('Failed to run task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: 'Failed to run task', error: errorMessage }, { status: 500 });
  }
} 