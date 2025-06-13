import { NextResponse } from 'next/server';
import { marked } from 'marked';

// Force dynamic behavior for this route
export const dynamic = 'force-dynamic';

// Configure marked with basic options (without custom renderers for now)
marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert \n to <br>
    pedantic: false,
    sanitize: false, // We'll sanitize on the frontend if needed
    smartLists: true,
    smartypants: false,
});

export async function POST(request: Request) {
    try {
        const { content } = await request.json();

        if (!content || typeof content !== 'string') {
            return NextResponse.json({ 
                error: 'Content is required and must be a string' 
            }, { status: 400 });
        }

        // Convert markdown to HTML using default configuration
        const html = await marked(content);

        return NextResponse.json({
            html,
            success: true
        });

    } catch (error) {
        console.error('Failed to generate markdown preview:', error);
        return NextResponse.json({ 
            error: 'Failed to generate markdown preview',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
