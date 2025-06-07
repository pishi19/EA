export interface Loop {
    id: string;
    title: string;
    phase: number;
}

export interface EnrichedLoop extends Loop {
    status: string;
    score: number;
    tags: string[];
    summary: string;
    content: string; // HTML content
    created: string;
    workstream: string;
}

export interface Phase {
    id: string;
    title: string;
    status: 'complete' | 'in_progress' | 'pending';
    phase: number;
    score: number;
    loops: Loop[];
}

export interface EnrichedPhase extends Phase {
    content: string; // HTML content
    loops: EnrichedLoop[];
}

export interface ChatMessage {
    timestamp: string;
    speaker: 'user' | 'ora';
    message: string;
}

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