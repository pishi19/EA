import { NextRequest, NextResponse } from 'next/server';

interface TaskContext {
    taskId: string;
    taskDescription: string;
    taskStatus: string;
    taskAddedBy: string;
    taskSource: string;
    taskContext?: string;
    taskSection: string;
    promotedTo?: string;
}

interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'assistant' | 'system';
    timestamp: Date;
}

interface TaskChatRequest {
    message: string;
    context: TaskContext;
    conversationHistory: ChatMessage[];
}

export async function POST(request: NextRequest) {
    try {
        const body: TaskChatRequest = await request.json();
        const { message, context, conversationHistory } = body;

        // Build contextual response based on task details and user message
        const response = await generateTaskChatResponse(message, context, conversationHistory);

        return NextResponse.json({
            content: response,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Task chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat message' },
            { status: 500 }
        );
    }
}

async function generateTaskChatResponse(
    message: string,
    context: TaskContext,
    conversationHistory: ChatMessage[]
): Promise<string> {
    const {
        taskDescription,
        taskStatus,
        taskAddedBy,
        taskSource,
        taskContext,
        taskSection,
        promotedTo
    } = context;

    // Analyze message intent and provide contextual responses
    const messageLower = message.toLowerCase();

    // Status-related queries
    if (messageLower.includes('status') || messageLower.includes('progress')) {
        const statusResponse = getStatusResponse(taskStatus);
        return `The current status of this task is "${taskStatus}". ${statusResponse}`;
    }

    // Completion/marking as done queries
    if (messageLower.includes('complete') || messageLower.includes('done') || messageLower.includes('finish')) {
        if (taskStatus === 'done') {
            return "This task is already marked as complete! Is there anything else you'd like to do with it?";
        }
        return `To mark this task as complete, you can click the checkbox next to the task description. This will update the status from "${taskStatus}" to "done".`;
    }

    // Help with execution or next steps
    if (messageLower.includes('how') || messageLower.includes('help') || messageLower.includes('start') || messageLower.includes('begin')) {
        return getExecutionHelp(taskDescription, taskStatus, taskSection, taskAddedBy);
    }

    // Context or background information
    if (messageLower.includes('context') || messageLower.includes('background') || messageLower.includes('why')) {
        return getContextResponse(taskDescription, taskContext, taskSource, taskAddedBy);
    }

    // Promotion or execution queries
    if (messageLower.includes('promote') || messageLower.includes('execution') || messageLower.includes('loop')) {
        if (promotedTo) {
            return `This task has already been promoted to: ${promotedTo}. You can find the execution details there.`;
        }
        if (taskStatus === 'done') {
            return "This task is already complete, so promotion might not be necessary. However, if you need to create follow-up work, you can use the promote button to create a new loop or add it to an existing execution.";
        }
        return "To promote this task to execution, click the green arrow (↗) button. This will allow you to create a new loop file or add the task to an existing loop for detailed execution tracking.";
    }

    // Edit or modification queries
    if (messageLower.includes('edit') || messageLower.includes('change') || messageLower.includes('modify') || messageLower.includes('update')) {
        return "To edit this task, click the pencil (✏) icon. You can modify the description and save your changes. The task will maintain its current status and other metadata.";
    }

    // Priority or urgency
    if (messageLower.includes('priority') || messageLower.includes('urgent') || messageLower.includes('important')) {
        return getPriorityResponse(taskAddedBy, taskSection, taskSource);
    }

    // Suggestions for improvement or optimization
    if (messageLower.includes('improve') || messageLower.includes('optimize') || messageLower.includes('better')) {
        return getImprovementSuggestions(taskDescription, taskStatus, taskAddedBy);
    }

    // General task management advice
    if (messageLower.includes('manage') || messageLower.includes('organize') || messageLower.includes('workflow')) {
        return getWorkflowAdvice(taskSection, taskStatus);
    }

    // Default contextual response
    return getDefaultResponse(taskDescription, taskStatus, conversationHistory);
}

function getStatusResponse(status: string): string {
    switch (status) {
        case 'pending':
            return "This task is waiting to be started. Consider breaking it down into smaller steps if it seems complex.";
        case 'done':
            return "Great work! This task has been completed. You might want to review what was accomplished or consider any follow-up actions.";
        case 'rejected':
            return "This task has been rejected. You might want to review why it was rejected and decide if it needs to be re-approached differently.";
        case 'promoted':
            return "This task has been promoted to execution, meaning it's now part of a detailed execution loop or project file.";
        default:
            return "I can help you understand more about this task status.";
    }
}

function getExecutionHelp(description: string, status: string, section: string, addedBy: string): string {
    const isOraTask = addedBy === 'ora';
    const baseAdvice = isOraTask 
        ? "Since this is an Ora-suggested task, it was generated based on system analysis. "
        : "Since this is a user-defined task, ";

    if (status === 'done') {
        return `${baseAdvice}This task is already complete! If you need to do similar work, consider creating a new task or promoting this to a loop for future reference.`;
    }

    return `${baseAdvice}Here are some suggestions for getting started:

1. **Break it down**: If the task seems large, consider breaking "${description}" into smaller, actionable steps
2. **Set context**: Add any relevant context or notes to help track progress
3. **Time estimation**: Think about how long this might take to help with planning
4. **Dependencies**: Consider if this task depends on other work being completed first

Would you like help with any of these aspects?`;
}

function getContextResponse(description: string, taskContext?: string, source?: string, addedBy?: string): string {
    let response = `This task: "${description}"\n\n`;
    
    if (taskContext) {
        response += `**Context provided**: ${taskContext}\n\n`;
    }
    
    response += `**Origin**: This task was ${addedBy === 'ora' ? 'suggested by Ora (AI system)' : 'created by a user'}\n`;
    
    if (source) {
        response += `**Source**: ${source}\n`;
    }
    
    response += '\nThis context helps understand the background and purpose of the task.';
    
    return response;
}

function getPriorityResponse(addedBy: string, section: string, source: string): string {
    const isOraTask = addedBy === 'ora';
    
    if (isOraTask) {
        return `As an Ora-suggested task, this was identified through system analysis and might indicate something that needs attention. Consider its priority based on:

1. **System impact**: How does this affect overall workflow?
2. **Urgency**: Is this blocking other work?
3. **Resources**: Do you have what's needed to complete this now?

Ora-suggested tasks often highlight optimization opportunities or maintenance needs.`;
    }
    
    return `As a user-defined task, you have the best context for its priority. Consider:

1. **Deadlines**: Are there time constraints?
2. **Dependencies**: Is other work waiting on this?
3. **Impact**: How important is this for your goals?
4. **Effort**: How much time and energy will this require?

You can add context notes to help track priority reasoning.`;
}

function getImprovementSuggestions(description: string, status: string, addedBy: string): string {
    let suggestions = `Here are some ways to improve this task:\n\n`;
    
    if (status === 'pending') {
        suggestions += `**Since it's still pending:**\n`;
        suggestions += `• Add more specific acceptance criteria\n`;
        suggestions += `• Break into smaller, measurable steps\n`;
        suggestions += `• Set a realistic timeline or deadline\n`;
        suggestions += `• Add relevant context or background\n\n`;
    }
    
    suggestions += `**General improvements:**\n`;
    suggestions += `• Make the description more specific and actionable\n`;
    suggestions += `• Add tags or labels for better organization\n`;
    suggestions += `• Consider if this should be promoted to a full execution loop\n`;
    suggestions += `• Link to related tasks or dependencies\n\n`;
    
    if (addedBy === 'ora') {
        suggestions += `**For Ora-suggested tasks:** Review if the AI's analysis aligns with your current priorities and adjust accordingly.`;
    } else {
        suggestions += `**For user-defined tasks:** Consider if this fits well with your current workflow and adjust the scope if needed.`;
    }
    
    return suggestions;
}

function getWorkflowAdvice(section: string, status: string): string {
    return `**Task Management Tips for ${section}:**

**Organization:**
• Use consistent naming patterns for similar tasks
• Group related tasks by adding them to the same timeframe
• Regularly review and clean up completed tasks

**Workflow:**
• Start with high-impact, low-effort tasks to build momentum
• Use the promotion feature for tasks that need detailed execution tracking
• Add context notes to capture important details or decisions

**Status Management:**
• Keep status updated to reflect actual progress
• Use 'rejected' status for tasks that are no longer relevant
• Promote tasks that grow in scope to full execution loops

**Current status**: This task is ${status}, which means ${getStatusResponse(status).toLowerCase()}`;
}

function getDefaultResponse(description: string, status: string, conversationHistory: ChatMessage[]): string {
    const hasHistory = conversationHistory.length > 0;
    
    if (hasHistory) {
        return `I'm here to help with "${description}". Based on our conversation, is there a specific aspect of this task you'd like to focus on? I can help with:

• Understanding the current status (${status})
• Planning next steps or execution approach
• Breaking down the task into smaller pieces
• Providing context or background information
• Suggesting improvements or optimizations

What would be most helpful for you right now?`;
    }
    
    return `I can help you with this task: "${description}"

The task is currently ${status}. Here are some ways I can assist:

• **Status & Progress**: Help understand where things stand
• **Execution Planning**: Suggest approaches or break down the work
• **Context & Background**: Provide relevant information
• **Improvements**: Suggest optimizations or enhancements
• **Workflow**: Advise on task management best practices

What would you like to explore about this task?`;
} 