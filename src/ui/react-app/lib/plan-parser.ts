import path from 'path';

// --- Types ---
export interface Task {
    id: string;
    description: string;
    added_by: 'user' | 'ora';
    status: 'pending' | 'done' | 'rejected' | 'promoted';
    source: string;
    context?: string;
    section: 'User-Defined Tasks' | 'Ora-Suggested Tasks';
    promoted_to?: string;
}

// --- Constants ---
const PLAN_PATH = path.resolve(process.cwd(), '../../../runtime/workstreams/roadmap/workstream_plan.md');


// --- Functions ---

export const parsePlan = (content: string): Task[] => {
    const tasks: Task[] = [];
    let currentSection: 'User-Defined Tasks' | 'Ora-Suggested Tasks' | null = null;

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        const sectionMatch = trimmedLine.match(/^### (User-Defined Tasks|Ora-Suggested Tasks)/);
        if (sectionMatch) {
            currentSection = sectionMatch[1] as 'User-Defined Tasks' | 'Ora-Suggested Tasks';
            continue;
        }

        if (!currentSection) continue;

        const taskMatch = trimmedLine.match(/^- \[([ x-])\] (.*)/);
        if (taskMatch) {
            const [_, statusChar, description] = taskMatch;
            
            const task: Task = {
                description: description.trim(),
                status: statusChar === 'x' ? 'done' : 'pending',
                section: currentSection,
                id: Buffer.from(description.trim()).toString('base64'),
                added_by: 'user', // Default value
                source: `plan: ${path.basename(PLAN_PATH)}` // Default value
            };

            // Look ahead for metadata lines
            let nextLineIndex = i + 1;
            while (nextLineIndex < lines.length) {
                const nextLine = lines[nextLineIndex].trim();
                if (nextLine.startsWith('- [') || nextLine.startsWith('###') || nextLine === '---') {
                    break; // Stop if we hit the next task, a new section, or a separator
                }

                const metadataMatch = nextLine.match(/`([^`]+?):\s*([^`]+?)`/);
                if (metadataMatch) {
                    const [__, key, value] = metadataMatch;
                    const cleanKey = key.trim() as keyof Task;
                    (task as any)[cleanKey] = value.trim();
                } else if (nextLine) {
                    // Append to description if it's not metadata or a separator
                    task.description += '\n' + lines[nextLineIndex];
                }
                nextLineIndex++;
            }
            
            if (task.status === 'promoted') { // check status from metadata
                 task.status = 'promoted';
            }

            tasks.push(task);
            i = nextLineIndex - 1; // Move parser to the last processed line
        }
    }
    return tasks;
};

export const stringifyPlan = (tasks: Task[], existingContent: string): string => {
    const userTasks = tasks.filter(t => t.section === 'User-Defined Tasks' && t.status !== 'rejected');
    const oraTasks = tasks.filter(t => t.section === 'Ora-Suggested Tasks' && t.status !== 'rejected');

    const formatTask = (task: Task) => {
        const checkbox = task.status === 'done' ? '[x]' : '[ ]';
        let taskString = `- ${checkbox} ${task.description}\n`;
        taskString += `  \`added_by: ${task.added_by}\`\n`;
        taskString += `  \`source: ${task.source}\`\n`;
        if (task.context) {
            taskString += `  \`context: ${task.context}\`\n`;
        }
        if (task.promoted_to) {
            taskString += `  \`promoted_to: ${task.promoted_to}\`\n`;
        }
        if (task.status === 'promoted') {
            taskString += `  \`status: promoted\`\n`;
        }
        return taskString;
    };

    const frontMatterMatch = existingContent.match(/---[\\s\\S]*?---/);
    const frontMatter = frontMatterMatch ? frontMatterMatch[0] : '';
    
    let newContent = frontMatter + '\n\n';
    
    newContent += `### User-Defined Tasks\n\n`;
    newContent += userTasks.map(formatTask).join('\n');
    
    newContent += `\n---\n\n`;
    
    newContent += `### Ora-Suggested Tasks\n\n`;
    newContent += oraTasks.map(formatTask).join('\n');

    return newContent;
}; 