import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { matterOptions } from '../ui/react-app/lib/yaml-engine'; // Re-using our safe engine

// --- Types and Interfaces ---
type MutationType = 'APPEND_TO_SECTION' | 'REPLACE_IN_SECTION' | 'PATCH_FRONTMATTER' | 'APPEND_TO_LOG';

interface MutationLog {
    timestamp: string;
    filePath: string;
    mutationType: MutationType;
    summary: string;
    loopOrTaskUuid?: string;
}

interface MutationErrorLog extends Omit<MutationLog, 'summary'> {
    error: string;
}

interface LogEntry {
    timestamp: string;
    actor: 'user' | 'ora';
    action: string;
}

interface DryRunResult {
    preImage: string;
    postImage: string;
    diff?: string;
}

// Default sections for loop files
const DEFAULT_LOOP_SECTIONS = [
    '## Purpose',
    '## ✅ Objectives',
    '## 🔧 Tasks',
    '## 🧾 Execution Log',
    '## 🧠 Memory Trace'
];

// --- Constants ---
const BASE_DIR = path.resolve(__dirname, '../../');
const MUTATION_LOG_PATH = path.join(BASE_DIR, 'runtime', 'logs', 'mutation-log.json');
const MUTATION_ERROR_LOG_PATH = path.join(BASE_DIR, 'runtime', 'logs', 'mutation-errors.json');


// --- Core Functions ---

async function readMatter(filePath: string) {
    const content = await fs.readFile(filePath, 'utf-8');
    return matter(content, matterOptions);
}

async function writeMatter(filePath: string, file: matter.GrayMatterFile<string>) {
    const newContent = matter.stringify(file.content, file.data);
    await fs.writeFile(filePath, newContent, 'utf-8');
}

async function logMutation(log: Omit<MutationLog, 'timestamp'>) {
    const newLog: MutationLog = {
        timestamp: new Date().toISOString(),
        ...log,
    };

    let logs: MutationLog[] = [];
    try {
        const content = await fs.readFile(MUTATION_LOG_PATH, 'utf-8');
        logs = JSON.parse(content);
    } catch (error) {
        // File might not exist yet, which is fine.
    }
    logs.push(newLog);
    
    // Ensure the directory exists before writing
    try {
        await fs.mkdir(path.dirname(MUTATION_LOG_PATH), { recursive: true });
        await fs.writeFile(MUTATION_LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (error) {
        // Log to console if file system logging fails
        console.log('Mutation logged (file logging failed):', newLog);
    }
}

async function logError(log: Omit<MutationErrorLog, 'timestamp'>) {
    const newErrorLog: MutationErrorLog = {
        timestamp: new Date().toISOString(),
        ...log,
    };
    let logs: MutationErrorLog[] = [];
    try {
        const content = await fs.readFile(MUTATION_ERROR_LOG_PATH, 'utf-8');
        logs = JSON.parse(content);
    } catch (error) { /* File might not exist yet */ }
    logs.push(newErrorLog);
    
    // Ensure the directory exists before writing
    try {
        await fs.mkdir(path.dirname(MUTATION_ERROR_LOG_PATH), { recursive: true });
        await fs.writeFile(MUTATION_ERROR_LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (error) {
        // Log to console if file system logging fails
        console.error('Error logged (file logging failed):', newErrorLog);
    }
}


// --- Mutation Engine ---

export const mutationEngine = {
    /**
     * Updates the frontmatter of a markdown file.
     */
    async patchFrontmatter(filePath: string, patchObject: Record<string, any>, uuid?: string): Promise<void> {
        const file = await readMatter(filePath);
        const originalData = { ...file.data };
        
        file.data = { ...file.data, ...patchObject };
        
        await writeMatter(filePath, file);

        await logMutation({
            filePath,
            mutationType: 'PATCH_FRONTMATTER',
            summary: `Updated frontmatter. Changes: ${JSON.stringify(patchObject)}`,
            loopOrTaskUuid: uuid,
        });
    },

    /**
     * Appends content to a specific section of a markdown file.
     * Throws an error if the section does not exist.
     */
    async appendToSection(filePath: string, sectionHeader: string, contentToAppend: string, uuid?: string): Promise<void> {
        const file = await readMatter(filePath);
        
        const sectionRegex = new RegExp(`(^${sectionHeader.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?)(?=\\n## |$)`, 'm');
        
        if (!file.content.includes(sectionHeader)) {
            throw new Error(`Validation Error: Section "${sectionHeader}" not found in ${filePath}.`);
        }

        file.content = file.content.replace(sectionHeader, `${sectionHeader}\n${contentToAppend}`);
        
        await writeMatter(filePath, file);

        await logMutation({
            filePath,
            mutationType: 'APPEND_TO_SECTION',
            summary: `Appended content to section "${sectionHeader}".`,
            loopOrTaskUuid: uuid,
        });
    },

    /**
     * Replaces content within a specific section of a markdown file.
     */
    async replaceInSection(filePath: string, sectionHeader: string, match: string | RegExp, replacement: string, uuid?: string): Promise<void> {
        const file = await readMatter(filePath);
        
        const sectionRegex = new RegExp(`(^${sectionHeader.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?)(?=\\n## |$)`, 'm');
        const sectionMatch = file.content.match(sectionRegex);

        if (!sectionMatch) {
            const err = new Error(`Validation Error: Section "${sectionHeader}" not found in ${filePath}.`);
            await logError({ filePath, mutationType: 'REPLACE_IN_SECTION', error: err.message, loopOrTaskUuid: uuid });
            throw err;
        }

        const originalSection = sectionMatch[0];
        const newSection = originalSection.replace(match, replacement);

        if (originalSection === newSection) return; // No change

        file.content = file.content.replace(originalSection, newSection);
        await writeMatter(filePath, file);

        await logMutation({
            filePath,
            mutationType: 'REPLACE_IN_SECTION',
            summary: `Replaced content in section "${sectionHeader}".`,
            loopOrTaskUuid: uuid,
        });
    },

    /**
     * Appends a structured log entry to the ## 🧾 Execution Log section.
     */
    async appendToLog(filePath: string, logEntry: LogEntry): Promise<void> {
        const file = await readMatter(filePath);
        const sectionHeader = '## 🧾 Execution Log';
        
        if (!file.content.includes(sectionHeader)) {
            throw new Error(`Validation Error: Section "${sectionHeader}" not found in ${filePath}.`);
        }

        // Format log entry consistently with existing entries
        const formattedEntry = `- ${logEntry.timestamp}: ${logEntry.actor === 'ora' ? '🤖' : '👤'} ${logEntry.action}`;
        
        // Find the section and append the log entry
        const sectionRegex = new RegExp(`(${sectionHeader.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?)(?=\\n## |$)`, 'm');
        const sectionMatch = file.content.match(sectionRegex);
        
        if (!sectionMatch) {
            throw new Error(`Validation Error: Section "${sectionHeader}" malformed in ${filePath}.`);
        }

        const originalSection = sectionMatch[0];
        const newSection = originalSection.endsWith('\n') 
            ? `${originalSection}${formattedEntry}\n`
            : `${originalSection}\n${formattedEntry}\n`;

        file.content = file.content.replace(originalSection, newSection);
        await writeMatter(filePath, file);

        await logMutation({
            filePath,
            mutationType: 'APPEND_TO_LOG',
            summary: `Appended log entry: ${logEntry.action}`,
        });
    },

    /**
     * Validates that a markdown file contains all required sections.
     * Throws detailed errors if sections are missing, malformed, or duplicated.
     */
    async validateMarkdownSchema(filePath: string, requiredSections: string[] = DEFAULT_LOOP_SECTIONS): Promise<void> {
        let content: string;
        try {
            content = await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            throw new Error(`Validation Error: File not found or unreadable at ${filePath}`);
        }

        const errors: string[] = [];
        const sectionsFound: Record<string, number> = {};

        // Count occurrences of each section
        for (const section of requiredSections) {
            const regex = new RegExp(`^${section.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'gm');
            const matches = content.match(regex);
            const count = matches ? matches.length : 0;
            sectionsFound[section] = count;

            if (count === 0) {
                errors.push(`Missing required section: "${section}"`);
            } else if (count > 1) {
                errors.push(`Duplicated section: "${section}" (found ${count} times)`);
            }
        }

        // Check for malformed sections (sections that don't start with ##)
        const allSectionHeaders = content.match(/^## .+$/gm) || [];
        for (const header of allSectionHeaders) {
            if (requiredSections.includes(header)) {
                // Check if section has content or is followed by another section
                const sectionRegex = new RegExp(`(^${header.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?)(?=\\n## |$)`, 'm');
                const sectionMatch = content.match(sectionRegex);
                if (!sectionMatch || sectionMatch[0].trim() === header.trim()) {
                    // Section exists but might be malformed (empty or immediately followed by another section)
                    // This is not necessarily an error, so we'll allow it
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(`Validation Error in ${filePath}:\n${errors.join('\n')}`);
        }
    },

    /**
     * Previews a mutation without writing to disk.
     * Returns preImage, postImage, and optionally a diff.
     */
    async dryRunMutation(filePath: string, mutationFn: (content: string) => string): Promise<DryRunResult> {
        let preImage: string;
        try {
            preImage = await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            throw new Error(`Dry Run Error: Cannot read file at ${filePath}`);
        }

        let postImage: string;
        try {
            postImage = mutationFn(preImage);
        } catch (error) {
            throw new Error(`Dry Run Error: Mutation function failed: ${error}`);
        }

        // Simple diff calculation (could be enhanced with a proper diff library)
        const diff = preImage === postImage ? undefined : 'Content changed';

        return {
            preImage,
            postImage,
            diff
        };
    }
}; 