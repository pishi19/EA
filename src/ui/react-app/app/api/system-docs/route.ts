import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

// Force dynamic behavior for this route since we use request.url
export const dynamic = 'force-dynamic';

// Helper function to parse frontmatter and content
async function parseMarkdownFile(filePath: string) {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    return { metadata: data, content };
}

// Helper function to convert filename to friendly name
function getFriendlyName(filename: string): string {
    const name = filename.replace('.md', '').replace('-', ' ');
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const selectedFile = searchParams.get('file');

        const docsDir = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'docs');

        // Check if docs directory exists
        try {
            await fs.access(docsDir);
        } catch (error) {
            return NextResponse.json({ message: 'Documentation directory not found' }, { status: 404 });
        }

        // Get all markdown files
        const files = await fs.readdir(docsDir);
        const markdownFiles = files.filter(file => file.endsWith('.md'));

        if (markdownFiles.length === 0) {
            return NextResponse.json({ message: 'No documentation files found' }, { status: 404 });
        }

        // Prepare file list with metadata
        const fileList = [];
        for (const file of markdownFiles) {
            const filePath = path.join(docsDir, file);
            const stats = await fs.stat(filePath);
            
            try {
                const { metadata } = await parseMarkdownFile(filePath);
                fileList.push({
                    filename: file,
                    friendlyName: getFriendlyName(file),
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    title: metadata.title || getFriendlyName(file),
                    tags: metadata.tags || []
                });
            } catch (error) {
                // If frontmatter parsing fails, still include the file
                fileList.push({
                    filename: file,
                    friendlyName: getFriendlyName(file),
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    title: getFriendlyName(file),
                    tags: []
                });
            }
        }

        // Sort files alphabetically by friendly name
        fileList.sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));

        // If a specific file is requested, return its content
        if (selectedFile) {
            const requestedFile = fileList.find(f => f.filename === selectedFile);
            if (!requestedFile) {
                return NextResponse.json({ message: 'File not found' }, { status: 404 });
            }

            const filePath = path.join(docsDir, selectedFile);
            const { metadata, content } = await parseMarkdownFile(filePath);
            const htmlContent = await marked(content);

            return NextResponse.json({
                fileList,
                selectedFile: {
                    ...requestedFile,
                    metadata,
                    content: htmlContent,
                    rawContent: content
                }
            });
        }

        // Return just the file list
        return NextResponse.json({
            fileList,
            selectedFile: null
        });

    } catch (error) {
        console.error('Failed to get system docs data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ 
            message: 'Failed to get system docs data', 
            error: errorMessage 
        }, { status: 500 });
    }
} 