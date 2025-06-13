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

// Helper function to validate filename
function validateFilename(filename: string): { valid: boolean; error?: string } {
    if (!filename || typeof filename !== 'string') {
        return { valid: false, error: 'Filename is required' };
    }

    if (!filename.endsWith('.md')) {
        return { valid: false, error: 'Filename must end with .md' };
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(filename)) {
        return { valid: false, error: 'Filename contains invalid characters' };
    }

    // Check for reserved names
    const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'];
    const baseName = filename.replace('.md', '').toLowerCase();
    if (reservedNames.includes(baseName)) {
        return { valid: false, error: 'Filename is a reserved name' };
    }

    return { valid: true };
}

// Helper function to get file metadata
async function getFileMetadata(filename: string, docsDir: string) {
    const filePath = path.join(docsDir, filename);
    const stats = await fs.stat(filePath);
    
    try {
        const { metadata } = await parseMarkdownFile(filePath);
        return {
            filename,
            friendlyName: getFriendlyName(filename),
            size: stats.size,
            modified: stats.mtime.toISOString(),
            title: metadata.title || getFriendlyName(filename),
            tags: metadata.tags || []
        };
    } catch (error) {
        return {
            filename,
            friendlyName: getFriendlyName(filename),
            size: stats.size,
            modified: stats.mtime.toISOString(),
            title: getFriendlyName(filename),
            tags: []
        };
    }
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
            try {
                const fileMetadata = await getFileMetadata(file, docsDir);
                fileList.push(fileMetadata);
            } catch (error) {
                console.error(`Error processing file ${file}:`, error);
                // Continue with other files
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

// PUT endpoint for saving/updating documents
export async function PUT(request: Request) {
    try {
        const { filename, content, lastModified } = await request.json();

        if (!filename || !content) {
            return NextResponse.json({ 
                success: false,
                message: 'Filename and content are required' 
            }, { status: 400 });
        }

        const validation = validateFilename(filename);
        if (!validation.valid) {
            return NextResponse.json({ 
                success: false,
                message: validation.error 
            }, { status: 400 });
        }

        const docsDir = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'docs');
        const filePath = path.join(docsDir, filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return NextResponse.json({ 
                success: false,
                message: 'File not found' 
            }, { status: 404 });
        }

        // Check for conflicts (optional - if lastModified is provided)
        if (lastModified) {
            const stats = await fs.stat(filePath);
            const currentModified = stats.mtime.toISOString();
            if (currentModified !== lastModified) {
                return NextResponse.json({ 
                    success: false,
                    message: 'File has been modified by another user. Please refresh and try again.',
                    conflict: true 
                }, { status: 409 });
            }
        }

        // Write the file
        await fs.writeFile(filePath, content, 'utf-8');

        // Get updated file metadata
        const fileMetadata = await getFileMetadata(filename, docsDir);
        const { metadata, content: rawContent } = await parseMarkdownFile(filePath);
        const htmlContent = await marked(rawContent);

        return NextResponse.json({
            success: true,
            message: 'Document saved successfully',
            file: {
                ...fileMetadata,
                metadata,
                content: htmlContent,
                rawContent
            }
        });

    } catch (error) {
        console.error('Failed to save document:', error);
        return NextResponse.json({ 
            success: false,
            message: 'Failed to save document',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST endpoint for creating new documents
export async function POST(request: Request) {
    try {
        const { filename, content = '' } = await request.json();

        if (!filename) {
            return NextResponse.json({ 
                success: false,
                message: 'Filename is required' 
            }, { status: 400 });
        }

        const validation = validateFilename(filename);
        if (!validation.valid) {
            return NextResponse.json({ 
                success: false,
                message: validation.error 
            }, { status: 400 });
        }

        const docsDir = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'docs');
        const filePath = path.join(docsDir, filename);

        // Check if file already exists
        try {
            await fs.access(filePath);
            return NextResponse.json({ 
                success: false,
                message: 'File already exists' 
            }, { status: 409 });
        } catch (error) {
            // File doesn't exist, which is what we want
        }

        // Ensure docs directory exists
        try {
            await fs.access(docsDir);
        } catch (error) {
            await fs.mkdir(docsDir, { recursive: true });
        }

        // Write the file
        await fs.writeFile(filePath, content, 'utf-8');

        // Get file metadata
        const fileMetadata = await getFileMetadata(filename, docsDir);
        const { metadata, content: rawContent } = await parseMarkdownFile(filePath);
        const htmlContent = await marked(rawContent);

        return NextResponse.json({
            success: true,
            message: 'Document created successfully',
            file: {
                ...fileMetadata,
                metadata,
                content: htmlContent,
                rawContent
            }
        });

    } catch (error) {
        console.error('Failed to create document:', error);
        return NextResponse.json({ 
            success: false,
            message: 'Failed to create document',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// DELETE endpoint for deleting documents
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('file');

        if (!filename) {
            return NextResponse.json({ 
                success: false,
                message: 'Filename is required' 
            }, { status: 400 });
        }

        const docsDir = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'docs');
        const filePath = path.join(docsDir, filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return NextResponse.json({ 
                success: false,
                message: 'File not found' 
            }, { status: 404 });
        }

        // Delete the file
        await fs.unlink(filePath);

        return NextResponse.json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('Failed to delete document:', error);
        return NextResponse.json({ 
            success: false,
            message: 'Failed to delete document',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 