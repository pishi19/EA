import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// --- Types ---
export interface InteractionLogData {
    actor: 'user' | 'ora';
    source: 'loop' | 'ui' | 'api' | 'chat' | 'gmail' | 'slack' | 'system';
    context: string; // loop-uuid, phase, task-uuid, etc.
    tags: string[];
    message: string;
    outcome: string;
}

export interface InteractionContext {
    contextType?: 'loop' | 'phase' | 'task' | 'system';
    contextId?: string;
    filePath?: string;
    action?: string;
}

// --- Path Resolution ---
const BASE_DIR = path.resolve(process.cwd(), '../../..');
const INTERACTIONS_DIR = path.join(BASE_DIR, 'runtime', 'interactions');

// --- Utility Functions ---

/**
 * Generates a unique interaction UUID
 */
function generateInteractionUuid(): string {
    return `interaction-${Date.now()}-${uuidv4().slice(0, 8)}`;
}

/**
 * Formats timestamp for filename
 */
function formatTimestampForFilename(timestamp: Date): string {
    return timestamp.toISOString()
        .replace(/T/, '-')
        .replace(/:/g, '')
        .replace(/\..+/, '')
        .slice(0, 15); // YYYY-MM-DD-HHMM
}

/**
 * Generates interaction filename
 */
function generateInteractionFilename(timestamp: Date, contextId?: string): string {
    const timestampStr = formatTimestampForFilename(timestamp);
    const suffix = contextId ? `-${contextId}` : '';
    return `interaction-${timestampStr}${suffix}.md`;
}

/**
 * Creates the frontmatter and content for an interaction log
 */
function createInteractionContent(data: InteractionLogData, uuid: string, timestamp: string): string {
    return `---
uuid: ${uuid}
timestamp: ${timestamp}
actor: ${data.actor}
source: ${data.source}
context: ${data.context}
tags: [${data.tags.join(', ')}]
---

## 💬 Message

${data.message}

## 🔄 Outcome

${data.outcome}
`;
}

/**
 * Determines context and tags from interaction details
 */
function deriveContextAndTags(
    interactionType: string,
    context: InteractionContext,
    actor: 'user' | 'ora'
): { contextStr: string; tags: string[] } {
    const { contextType, contextId, action } = context;
    
    let contextStr = contextId || 'unknown';
    let tags = ['interaction'];

    // Add context-specific tags
    if (contextType) {
        tags.push(contextType);
        if (contextType === 'loop' && contextId) {
            contextStr = contextId;
            tags.push('loop-interaction');
        } else if (contextType === 'task' && contextId) {
            contextStr = contextId;
            tags.push('task-management');
        } else if (contextType === 'phase' && contextId) {
            contextStr = contextId;
            tags.push('phase-interaction');
        }
    }

    // Add interaction type tags
    tags.push(interactionType);
    
    // Add action-specific tags
    if (action) {
        tags.push(action);
    }

    // Add actor-specific tags
    tags.push(`${actor}-action`);

    return { contextStr, tags };
}

// --- Main Logging Function ---

/**
 * Logs an interaction to the interactions directory
 */
export async function logInteraction(
    interactionType: string,
    message: string,
    outcome: string,
    actor: 'user' | 'ora',
    source: InteractionLogData['source'],
    context: InteractionContext = {}
): Promise<string> {
    try {
        // Ensure interactions directory exists
        await fs.mkdir(INTERACTIONS_DIR, { recursive: true });

        // Generate interaction metadata
        const uuid = generateInteractionUuid();
        const timestamp = new Date();
        const timestampIso = timestamp.toISOString();
        
        // Derive context and tags
        const { contextStr, tags } = deriveContextAndTags(interactionType, context, actor);

        // Create interaction data
        const interactionData: InteractionLogData = {
            actor,
            source,
            context: contextStr,
            tags,
            message,
            outcome
        };

        // Generate filename and content
        const filename = generateInteractionFilename(timestamp, context.contextId);
        const content = createInteractionContent(interactionData, uuid, timestampIso);
        const filePath = path.join(INTERACTIONS_DIR, filename);

        // Write the interaction log
        await fs.writeFile(filePath, content, 'utf-8');

        console.log(`✅ Interaction logged: ${uuid} -> ${filename}`);
        return uuid;

    } catch (error) {
        console.error('❌ Failed to log interaction:', error);
        throw error;
    }
}

// --- Convenience Functions ---

/**
 * Logs a chat message interaction
 */
export async function logChatInteraction(
    message: string,
    actor: 'user' | 'ora',
    contextType: string,
    contextId: string,
    filePath?: string
): Promise<string> {
    const interactionMessage = `Chat message in ${contextType} ${contextId}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`;
    const outcome = `Message successfully posted to ${filePath ? filePath : `${contextType}/${contextId}`} chat history.`;
    
    return logInteraction(
        'chat-message',
        interactionMessage,
        outcome,
        actor,
        'chat',
        { contextType: contextType as any, contextId, filePath, action: 'post-message' }
    );
}

/**
 * Logs a task management interaction
 */
export async function logTaskInteraction(
    action: 'create' | 'update' | 'delete' | 'promote',
    taskDescription: string,
    actor: 'user' | 'ora',
    outcome: string,
    contextId?: string
): Promise<string> {
    const interactionMessage = `Task ${action}: "${taskDescription.substring(0, 100)}${taskDescription.length > 100 ? '...' : ''}"`;
    
    return logInteraction(
        'task-management',
        interactionMessage,
        outcome,
        actor,
        'ui',
        { contextType: 'task', contextId, action: `task-${action}` }
    );
}

/**
 * Logs a memory/execution log interaction
 */
export async function logMemoryExecutionInteraction(
    section: 'memory' | 'execution',
    message: string,
    contextType: string,
    contextId: string,
    filePath?: string
): Promise<string> {
    const interactionMessage = `${section === 'memory' ? 'Memory trace' : 'Execution log'} entry: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`;
    const outcome = `Successfully logged to ${section} section in ${filePath || `${contextType}/${contextId}`}.`;
    
    return logInteraction(
        `${section}-log`,
        interactionMessage,
        outcome,
        'ora',
        'api',
        { contextType: contextType as any, contextId, filePath, action: `log-${section}` }
    );
}

/**
 * Logs a UI interaction (form submission, button click, etc.)
 */
export async function logUIInteraction(
    action: string,
    details: string,
    outcome: string,
    contextId?: string
): Promise<string> {
    const interactionMessage = `UI ${action}: ${details}`;
    
    return logInteraction(
        'ui-interaction',
        interactionMessage,
        outcome,
        'user',
        'ui',
        { contextId, action }
    );
} 