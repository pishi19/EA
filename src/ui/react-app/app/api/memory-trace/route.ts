import { NextRequest, NextResponse } from 'next/server';

interface MemoryTraceEntry {
    id: string;
    timestamp: string;
    type: 'creation' | 'chat' | 'mutation' | 'file_update';
    content: string;
    source: 'user' | 'assistant' | 'system';
    metadata?: any;
}

interface AddTraceRequest {
    artefactId: string;
    entry: Omit<MemoryTraceEntry, 'id' | 'timestamp'>;
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const artefactId = url.searchParams.get('artefactId');

        if (!artefactId) {
            return NextResponse.json(
                { error: 'Missing artefactId parameter' },
                { status: 400 }
            );
        }

        // In real implementation, this would fetch from database
        const mockTrace: MemoryTraceEntry[] = [
            {
                id: '1',
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                type: 'creation',
                content: `Artefact created from ui-add`,
                source: 'system',
                metadata: { origin: 'ui-add', filePath: `runtime/loops/${artefactId}.md` }
            },
            {
                id: '2',
                timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                type: 'chat',
                content: 'Chat session initialized',
                source: 'system'
            }
        ];

        return NextResponse.json({ trace: mockTrace });

    } catch (error) {
        console.error('Memory trace fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: AddTraceRequest = await request.json();
        const { artefactId, entry } = body;

        if (!artefactId || !entry) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newEntry: MemoryTraceEntry = {
            ...entry,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        };

        // In real implementation, this would save to database
        console.log(`Adding memory trace entry for ${artefactId}:`, newEntry);

        return NextResponse.json({ entry: newEntry });

    } catch (error) {
        console.error('Memory trace add error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 