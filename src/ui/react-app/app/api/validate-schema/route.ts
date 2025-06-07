import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Default sections for different file types
const DEFAULT_LOOP_SECTIONS = [
    '## Purpose',
    '## ✅ Objectives', 
    '## 🔧 Tasks',
    '## 🧾 Execution Log',
    '## 🧠 Memory Trace'
];

const DEFAULT_PHASE_SECTIONS = [
    '## ✅ Completed Loops',
    '## 🏁 Phase Complete'
];

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    missingRequiredSections: string[];
    duplicatedSections: string[];
}

function validateMarkdownSchema(content: string, requiredSections: string[] = DEFAULT_LOOP_SECTIONS): ValidationResult {
    const errors: string[] = [];
    const missingRequiredSections: string[] = [];
    const duplicatedSections: string[] = [];
    const sectionsFound: Record<string, number> = {};

    // Count occurrences of each section
    for (const section of requiredSections) {
        const regex = new RegExp(`^${section.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'gm');
        const matches = content.match(regex);
        const count = matches ? matches.length : 0;
        sectionsFound[section] = count;

        if (count === 0) {
            missingRequiredSections.push(section);
            errors.push(`Missing required section: "${section}"`);
        } else if (count > 1) {
            duplicatedSections.push(section);
            errors.push(`Duplicated section: "${section}" (found ${count} times)`);
        }
    }

    const isValid = errors.length === 0;
    return { isValid, errors, missingRequiredSections, duplicatedSections };
}

export async function POST(request: Request) {
    try {
        const { filePath, content, fileType = 'loop' } = await request.json();

        if (!content && !filePath) {
            return NextResponse.json({ 
                message: 'Either content or filePath must be provided' 
            }, { status: 400 });
        }

        let markdownContent = content;
        
        // If filePath is provided, read the file
        if (filePath && !content) {
            const BASE_DIR = path.resolve(process.cwd(), '../../..');
            const fullPath = path.join(BASE_DIR, filePath);
            
            try {
                markdownContent = await fs.readFile(fullPath, 'utf-8');
            } catch (error) {
                return NextResponse.json({ 
                    message: `Failed to read file: ${filePath}`,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }, { status: 404 });
            }
        }

        // Choose appropriate validation sections based on file type
        const requiredSections = fileType === 'phase' ? DEFAULT_PHASE_SECTIONS : DEFAULT_LOOP_SECTIONS;
        
        // Validate the markdown content
        const validation = validateMarkdownSchema(markdownContent, requiredSections);
        
        // Log validation failures to server console
        if (!validation.isValid) {
            console.warn(`Schema validation failed for ${filePath || 'provided content'}:`, {
                fileType,
                errors: validation.errors,
                missingRequiredSections: validation.missingRequiredSections
            });
        }

        return NextResponse.json({
            ...validation,
            fileType,
            filePath: filePath || 'inline-content'
        });

    } catch (error) {
        console.error('Validation API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ 
            message: 'Failed to validate schema', 
            error: errorMessage 
        }, { status: 500 });
    }
} 