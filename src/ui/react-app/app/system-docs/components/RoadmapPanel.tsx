import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
                const data = await response.json();
                if (data.selectedFile?.content) {
                    setRoadmapContent(data.selectedFile.content);
                }
            }
        } catch (error) {
            console.error('Failed to load roadmap:', error);
            setRoadmapContent('<p>Error loading roadmap content.</p>');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
        if (!isExpanded && !roadmapContent) {
            loadRoadmap();
        }
    };

    return (
        <Card className={`mb-6 ${className}`}>
            <Collapsible open={isExpanded} onOpenChange={handleToggle}>
                <CardHeader className="pb-3">
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-between p-0 h-auto hover:bg-transparent"
                            onClick={handleToggle}
                        >
                            <CardTitle className="text-xl font-bold flex items-center gap-3">
                                <FileText className="h-6 w-6 text-blue-600" />
                                📋 Complete System Roadmap
                            </CardTitle>
                            {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    
                    {!isExpanded && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Click to view the complete system roadmap with all phases, projects, and current focus areas.
                        </p>
                    )}
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-4">
                        {loading ? (
                            <div className="bg-gray-50 rounded-lg p-6 text-center border">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600">Loading roadmap...</p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto border">
                                <div 
                                    className="prose prose-sm max-w-none leading-relaxed"
                                    dangerouslySetInnerHTML={{ 
                                        __html: roadmapContent || '<p>No roadmap content available.</p>'
                                    }}
                                />
                            </div>
                        )}
                        
                        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                            <span>Source: runtime/docs/roadmap.md</span>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                        // Try to select roadmap.md in the document list
                                        const roadmapDoc = document.querySelector('[data-filename="roadmap.md"]') as HTMLElement;
                                        if (roadmapDoc) {
                                            roadmapDoc.click();
                                        }
                                    }}
                                >
                                    View in Docs
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                        window.open('/workstream-filter-demo', '_blank');
                                    }}
                                >
                                    View Workstreams
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
