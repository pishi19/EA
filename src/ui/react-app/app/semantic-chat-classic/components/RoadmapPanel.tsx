import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface RoadmapPanelProps {
    className?: string;
}

export default function RoadmapPanel({ className = "" }: RoadmapPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [roadmapContent, setRoadmapContent] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const loadRoadmap = async () => {
        if (roadmapContent) return; // Don't reload if already loaded
        
        setLoading(true);
        try {
            const response = await fetch('/api/system-docs?file=roadmap.md');
            if (response.ok) {
                const content = await response.text();
                setRoadmapContent(content);
            }
        } catch (error) {
            console.error('Error loading roadmap:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        if (!isExpanded && !roadmapContent) {
            loadRoadmap();
        }
        setIsExpanded(!isExpanded);
    };

    // Format the roadmap content for display
    const formatRoadmapContent = (content: string) => {
        return content
            .split('\n')
            .map((line, index) => {
                // Handle headers
                if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-blue-800">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-blue-900">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-2xl font-bold mt-8 mb-4 text-blue-950">{line.replace('# ', '')}</h1>;
                }
                
                // Handle list items
                if (line.trim().startsWith('- ')) {
                    return <li key={index} className="ml-4 mb-1 text-gray-700">{line.replace(/^[\s]*- /, '')}</li>;
                }
                
                // Handle bold text
                if (line.includes('**') && line.trim()) {
                    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return <p key={index} className="mb-2 text-gray-800" dangerouslySetInnerHTML={{ __html: formatted }} />;
                }
                
                // Handle empty lines
                if (!line.trim()) {
                    return <br key={index} />;
                }
                
                // Regular paragraphs
                return <p key={index} className="mb-2 text-gray-700">{line}</p>;
            });
    };

    return (
        <Card className={`mb-6 ${className}`}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        🗺️ Complete System Roadmap
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggle}
                        className="flex items-center gap-2"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="h-4 w-4" />
                                Collapse
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4" />
                                Expand Roadmap
                            </>
                        )}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Complete system roadmap with current focus and project status
                </p>
            </CardHeader>
            
            {isExpanded && (
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">
                            <p className="text-muted-foreground">Loading roadmap...</p>
                        </div>
                    ) : roadmapContent ? (
                        <div className="prose max-w-none">
                            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                                {formatRoadmapContent(roadmapContent)}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-muted-foreground">Failed to load roadmap content</p>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
} 