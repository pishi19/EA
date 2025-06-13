import React, { useState, useRef, useEffect } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Type, Maximize, Minimize } from 'lucide-react';

interface DocEditorProps {
    content: string;
    onChange: (content: string) => void;
    onPreview: (content: string) => Promise<string>;
    className?: string;
}

export default function DocEditor({ content, onChange, onPreview, className = "" }: DocEditorProps) {
    const [activeView, setActiveView] = useState<'edit' | 'preview' | 'split'>('edit');
    const [previewContent, setPreviewContent] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Generate preview content when switching to preview mode
    const generatePreview = async () => {
        if (activeView === 'preview' || activeView === 'split') {
            setIsLoading(true);
            try {
                const html = await onPreview(content);
                setPreviewContent(html);
            } catch (error) {
                console.error('Preview generation failed:', error);
                setPreviewContent('<p>Preview generation failed</p>');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Regenerate preview when content changes and in preview mode
    useEffect(() => {
        if (activeView === 'preview' || activeView === 'split') {
            const debounceTimer = setTimeout(generatePreview, 300);
            return () => clearTimeout(debounceTimer);
        }
    }, [content, activeView]);

    // Initial preview generation
    useEffect(() => {
        generatePreview();
    }, [activeView]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'e':
                        e.preventDefault();
                        setActiveView('edit');
                        break;
                    case 'p':
                        e.preventDefault();
                        setActiveView('preview');
                        break;
                    case 's':
                        e.preventDefault();
                        setActiveView('split');
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    const renderEditor = () => (
        <div className="relative h-full">
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-full min-h-[400px] p-4 font-mono text-sm border-0 resize-none focus:outline-none bg-gray-50 dark:bg-gray-900"
                placeholder="Start writing your document in markdown..."
                spellCheck="false"
            />
        </div>
    );

    const renderPreview = () => (
        <div className="h-full overflow-auto">
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <div 
                    className="prose prose-sm max-w-none p-4 h-full"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                />
            )}
        </div>
    );

    return (
        <div className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'border rounded-lg'}`}>
            {/* Header with view controls */}
            <div className="flex items-center justify-between p-2 border-b bg-gray-50 dark:bg-gray-800">
                <div className="flex space-x-2">
                    <Button
                        variant={activeView === 'edit' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveView('edit')}
                        className="flex items-center space-x-1"
                    >
                        <Type className="w-4 h-4" />
                        <span>Edit</span>
                    </Button>
                    <Button
                        variant={activeView === 'preview' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveView('preview')}
                        className="flex items-center space-x-1"
                    >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                    </Button>
                    <Button
                        variant={activeView === 'split' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveView('split')}
                        className="flex items-center space-x-1"
                    >
                        <div className="w-4 h-4 border-l-2 border-r-2 border-gray-600"></div>
                        <span>Split</span>
                    </Button>
                </div>

                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="flex items-center space-x-1"
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize className="w-4 h-4" />
                                <span>Exit Fullscreen</span>
                            </>
                        ) : (
                            <>
                                <Maximize className="w-4 h-4" />
                                <span>Fullscreen</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Content area */}
            <div className="h-full">
                {activeView === 'edit' && renderEditor()}
                {activeView === 'preview' && renderPreview()}
                {activeView === 'split' && (
                    <div className="flex h-full">
                        <div className="w-1/2 border-r">
                            {renderEditor()}
                        </div>
                        <div className="w-1/2">
                            {renderPreview()}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with shortcuts */}
            <div className="px-4 py-2 text-xs text-gray-500 border-t bg-gray-50 dark:bg-gray-800">
                <span>Shortcuts: </span>
                <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">Cmd+E</kbd> Edit, 
                <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">Cmd+P</kbd> Preview, 
                <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">Cmd+S</kbd> Split
            </div>
        </div>
    );
}
