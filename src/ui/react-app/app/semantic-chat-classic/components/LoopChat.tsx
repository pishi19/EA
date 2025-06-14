import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageSquare } from 'lucide-react';
import ChatPane from '@/components/chat/ChatPane';
import { Artefact } from '../services/artefactService';

interface LoopChatProps {
    artefact: Artefact;
    className?: string;
}

export default function LoopChat({ artefact, className = "" }: LoopChatProps) {
    const [chatHeight, setChatHeight] = useState(400);

    return (
        <div className={className}>
            <Accordion type="single" collapsible>
                <AccordionItem value="chat">
                    <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            💬 Chat
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="mt-4">
                        <div 
                            className="border rounded-lg overflow-hidden"
                            style={{ height: `${chatHeight}px` }}
                        >
                            <ChatPane
                                contextType="loop"
                                contextId={artefact.id}
                                filePath={artefact.filePath}
                                title={`💬 Chat - ${artefact.name}`}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                            <span>Resize chat panel:</span>
                            <div className="flex gap-1">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => setChatHeight(300)}
                                    className="h-6 px-2 text-xs"
                                >
                                    Small
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => setChatHeight(400)}
                                    className="h-6 px-2 text-xs"
                                >
                                    Medium
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => setChatHeight(600)}
                                    className="h-6 px-2 text-xs"
                                >
                                    Large
                                </Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
} 