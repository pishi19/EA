import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText } from 'lucide-react';

interface CreateDocumentDialogProps {
    onCreateDocument: (filename: string, content: string) => Promise<void>;
    trigger?: React.ReactNode;
}

export default function CreateDocumentDialog({ onCreateDocument, trigger }: CreateDocumentDialogProps) {
    const [open, setOpen] = useState(false);
    const [filename, setFilename] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [template, setTemplate] = useState('blank');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Document templates
    const templates = {
        blank: {
            name: 'Blank Document',
            content: '',
        },
        basic: {
            name: 'Basic Document',
            content: `# {title}

## Overview

{description}

## Content

Write your content here...

## Notes

- Add any additional notes
- Remember to update the document regularly`,
        },
        guide: {
            name: 'Guide/Tutorial',
            content: `# {title}

## Introduction

{description}

## Prerequisites

- List any prerequisites here

## Steps

### Step 1: Getting Started

Describe the first step...

### Step 2: Configuration

Describe the configuration...

### Step 3: Implementation

Describe the implementation...

## Troubleshooting

Common issues and solutions:

## Conclusion

Summary of what was accomplished...`,
        },
        api: {
            name: 'API Documentation',
            content: `# {title}

## Overview

{description}

## Endpoints

### GET /api/example

Description of the endpoint...

**Parameters:**
- \`param1\` (string): Description
- \`param2\` (number): Description

**Response:**
\`\`\`json
{
  "status": "success",
  "data": {}
}
\`\`\`

### POST /api/example

Description of the endpoint...

## Error Codes

- \`400\`: Bad Request
- \`401\`: Unauthorized
- \`404\`: Not Found
- \`500\`: Internal Server Error`,
        },
    };

    const handleCreate = async () => {
        if (!filename.trim()) {
            setError('Filename is required');
            return;
        }

        if (!filename.endsWith('.md')) {
            setError('Filename must end with .md');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            let content = templates[template as keyof typeof templates].content;
            
            // Replace placeholders
            content = content.replace(/{title}/g, title || filename.replace('.md', ''));
            content = content.replace(/{description}/g, description || 'Document description');

            await onCreateDocument(filename, content);
            
            // Reset form
            setFilename('');
            setTitle('');
            setDescription('');
            setTemplate('blank');
            setOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create document');
        } finally {
            setIsCreating(false);
        }
    };

    const handleFilenameChange = (value: string) => {
        // Auto-add .md extension if not present
        let cleanValue = value.replace(/[^a-zA-Z0-9\-_.]/g, '-');
        setFilename(cleanValue);
        
        // Auto-generate title from filename if not set
        if (!title && cleanValue) {
            const generatedTitle = cleanValue
                .replace('.md', '')
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            setTitle(generatedTitle);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        New Document
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Create New Document
                    </DialogTitle>
                    <DialogDescription>
                        Create a new markdown document in the system documentation.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    {/* Template Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="template">Template</Label>
                        <Select value={template} onValueChange={setTemplate}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(templates).map(([key, tmpl]) => (
                                    <SelectItem key={key} value={key}>
                                        {tmpl.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filename */}
                    <div className="grid gap-2">
                        <Label htmlFor="filename">Filename *</Label>
                        <Input
                            id="filename"
                            value={filename}
                            onChange={(e) => handleFilenameChange(e.target.value)}
                            placeholder="my-document.md"
                            className={error && error.includes('Filename') ? 'border-red-500' : ''}
                        />
                        <p className="text-xs text-gray-500">
                            Use lowercase letters, numbers, hyphens, and underscores only
                        </p>
                    </div>

                    {/* Title */}
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Document Title"
                        />
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the document..."
                            rows={3}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isCreating || !filename.trim()}
                    >
                        {isCreating ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Creating...
                            </div>
                        ) : (
                            'Create Document'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
