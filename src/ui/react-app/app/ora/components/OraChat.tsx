'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, RefreshCw } from 'lucide-react';
import InlinePatternBox from './InlinePatternBox';
import WorkstreamSummary from './WorkstreamSummary';
import { CREATION_FLOW, PATTERN_LABELS, MOCK_PL_PATTERNS } from '../lib/constants';

interface Message {
  id: string;
  message: string;
  speaker: 'user' | 'ora';
  created_at?: string;
  patterns?: Pattern[];
  stepId?: string;
  isWorkstreamSummary?: boolean;
  workstreamData?: WorkstreamData;
}

interface Pattern {
  pattern_type: string;
  pattern_content: string;
  examples?: string[];
  occurrence_count?: number;
}

interface WorkstreamData {
  workstream_type?: string;
  pl_context?: string;
  vision_template?: string;
  mission_template?: string;
  cadence_suggestion?: string;
  kpi_suggestion?: string;
  okr_template?: string;
}

interface OraChatProps {
  activeStep: string;
  completedSteps: string[];
  onStepChange: (step: string, completed: string[]) => void;
}

// Mock patterns for demonstration
const MOCK_PATTERNS: Record<string, Pattern[]> = {
  workstream_type: [
    {
      pattern_type: 'workstream_type',
      pattern_content: 'Engineering',
      examples: ['Frontend Development', 'Backend Services', 'DevOps & Infrastructure'],
      occurrence_count: 12
    },
    {
      pattern_type: 'workstream_type',
      pattern_content: 'Product',
      examples: ['Product Strategy', 'User Research', 'Feature Development'],
      occurrence_count: 8
    },
    {
      pattern_type: 'workstream_type',
      pattern_content: 'Sales & Marketing',
      examples: ['Customer Acquisition', 'Brand Development', 'Revenue Operations'],
      occurrence_count: 6
    }
  ],
  pl_context: [
    {
      pattern_type: 'pl_context',
      pattern_content: 'Startup Budget',
      examples: ['$100-500K annual, 3-5 headcount, must show ROI in 6 months'],
      occurrence_count: 8
    },
    {
      pattern_type: 'pl_context', 
      pattern_content: 'Enterprise Budget',
      examples: ['$1M+ annual, 10+ headcount, focus on scale and compliance'],
      occurrence_count: 12
    }
  ],
  vision_template: [
    {
      pattern_type: 'vision_template',
      pattern_content: 'Customer Support Excellence',
      examples: ['Achieve 95% customer satisfaction with 2-hour response times'],
      occurrence_count: 15
    },
    {
      pattern_type: 'vision_template',
      pattern_content: 'Product Development Speed',
      examples: ['Ship 3 major features per quarter with zero critical bugs'],
      occurrence_count: 10
    }
  ],
  mission_template: [
    {
      pattern_type: 'mission_template',
      pattern_content: 'Daily Customer Success',
      examples: ['Respond to all inquiries within 2 hours', 'Maintain 95% satisfaction rating'],
      occurrence_count: 18
    },
    {
      pattern_type: 'mission_template',
      pattern_content: 'Continuous Feature Delivery',
      examples: ['Ship weekly updates', 'Maintain zero critical bugs in production'],
      occurrence_count: 14
    }
  ],
  cadence_suggestion: [
    {
      pattern_type: 'cadence_suggestion',
      pattern_content: 'Agile Team Rhythm',
      examples: ['Daily 15-minute standups at 9am', 'Weekly sprint planning on Mondays'],
      occurrence_count: 20
    },
    {
      pattern_type: 'cadence_suggestion',
      pattern_content: 'Quarterly Planning Cycle',
      examples: ['Quarterly OKR reviews', 'Monthly all-hands updates'],
      occurrence_count: 8
    }
  ],
  kpi_suggestion: [
    {
      pattern_type: 'kpi_suggestion',
      pattern_content: 'Customer Satisfaction Metrics',
      examples: ['NPS Score > 70', 'Response Time < 2 hours', 'Resolution Rate > 90%'],
      occurrence_count: 22
    },
    {
      pattern_type: 'kpi_suggestion',
      pattern_content: 'Development Velocity',
      examples: ['Story Points per Sprint', 'Deploy Frequency', 'Lead Time to Production'],
      occurrence_count: 16
    }
  ],
  okr_template: [
    {
      pattern_type: 'okr_template',
      pattern_content: 'Customer Experience OKR',
      examples: ['O: Delight customers with exceptional support', 'KR1: Achieve NPS > 75', 'KR2: Reduce response time to < 1 hour'],
      occurrence_count: 19
    },
    {
      pattern_type: 'okr_template',
      pattern_content: 'Product Delivery OKR',
      examples: ['O: Accelerate feature delivery', 'KR1: Ship 3 major features', 'KR2: Maintain 99.9% uptime'],
      occurrence_count: 15
    }
  ]
};

// Removed CONVERSATION_FLOW - now using dynamic API responses

export default function OraChat({ activeStep, completedSteps, onStepChange }: OraChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [workstreamData, setWorkstreamData] = useState<WorkstreamData>({});
  const [isCreatingWorkstream, setIsCreatingWorkstream] = useState(false);
  const [allPatterns, setAllPatterns] = useState<Pattern[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch patterns on mount
  useEffect(() => {
    fetchPatterns();
  }, []);

  // Start conversation on mount
  useEffect(() => {
    if (messages.length === 0) {
      const introMessage: Message = {
        id: 'intro',
        message: "Hello! I'm Ora, here to help you create a strong workstream foundation. What area of work will this workstream serve?",
        speaker: 'ora',
        created_at: new Date().toISOString()
      };
      setMessages([introMessage]);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchPatterns = async () => {
    try {
      const response = await fetch('/api/ora/patterns?limit=50');
      if (response.ok) {
        const data = await response.json();
        setAllPatterns(data.patterns || []);
      }
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
    }
  };

  // Removed moveToNextStep - now handled by API responses

  const getRelevantPatterns = (stepId: string): Pattern[] => {
    // Use mock patterns for demo, or filter from allPatterns
    return MOCK_PATTERNS[stepId] || [];
  };

  const updateProgressFromConversation = () => {
    // Analyze the conversation to determine which steps have been completed
    const conversationText = messages.map(m => m.message.toLowerCase()).join(' ');
    const newCompleted: string[] = [];
    
    // Check for workstream type
    if (conversationText.includes('engineering') || 
        conversationText.includes('product') || 
        conversationText.includes('sales') ||
        conversationText.includes('customer') ||
        conversationText.includes('support')) {
      newCompleted.push('workstream_type');
    }
    
    // Check for P&L context
    if (conversationText.includes('budget') || 
        conversationText.includes('team') ||
        conversationText.includes('headcount') ||
        conversationText.includes('$')) {
      newCompleted.push('pl_context');
    }
    
    // Check for vision
    if (conversationText.includes('vision') || 
        conversationText.includes('achieve') ||
        conversationText.includes('future state')) {
      newCompleted.push('vision_template');
    }
    
    // Check for mission
    if (conversationText.includes('mission') || 
        conversationText.includes('daily') ||
        conversationText.includes('activities')) {
      newCompleted.push('mission_template');
    }
    
    // Check for cadence
    if (conversationText.includes('cadence') || 
        conversationText.includes('standup') ||
        conversationText.includes('weekly') ||
        conversationText.includes('meeting')) {
      newCompleted.push('cadence_suggestion');
    }
    
    // Update the state
    if (newCompleted.length > 0) {
      const activeStep = newCompleted[newCompleted.length - 1];
      onStepChange(activeStep, newCompleted);
    }
  };

  // Handle step revision from patterns panel
  useEffect(() => {
    if (activeStep) {
      const stepIndex = CREATION_FLOW.indexOf(activeStep as any);
      if (stepIndex >= 0 && stepIndex !== currentStepIndex && completedSteps.includes(activeStep)) {
        setCurrentStepIndex(stepIndex);
        
        // Add a message about revising
        const revisionMessage: Message = {
          id: `revision-${Date.now()}`,
          message: `Let's revise your ${PATTERN_LABELS[activeStep as keyof typeof PATTERN_LABELS] || activeStep}. What would you like to change?`,
          speaker: 'ora',
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, revisionMessage]);
      }
    }
  }, [activeStep, currentStepIndex, completedSteps]);

  const handlePatternSelect = (pattern: Pattern) => {
    // Automatically send the selected pattern
    sendMessage(pattern.pattern_content);
  };

  const completeWorkstreamCreation = () => {
    const summaryMessage: Message = {
      id: 'complete',
      message: "Excellent! I've captured all the essentials for your workstream. Here's what we've built together:",
      speaker: 'ora',
      created_at: new Date().toISOString(),
      isWorkstreamSummary: true,
      workstreamData: workstreamData
    };
    
    setMessages(prev => [...prev, summaryMessage]);
    setIsCreatingWorkstream(true);
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      message: messageText,
      speaker: 'user',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the Ora chat API
      const response = await fetch('/api/ora/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          workstream_id: `ora-${Date.now()}`,
          context: workstreamData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Ora');
      }

      const data = await response.json();

      // Add Ora's response with patterns/suggestions if available
      const oraMessage: Message = {
        id: `ora-${Date.now()}`,
        message: data.reply,
        speaker: 'ora',
        created_at: new Date().toISOString(),
        patterns: data.suggestions ? data.suggestions.map((s: string, i: number) => ({
          pattern_type: 'suggestion',
          pattern_content: s,
          occurrence_count: 1
        })) : undefined
      };
      setMessages(prev => [...prev, oraMessage]);

      // Track progress based on what's been discussed
      updateProgressFromConversation();
      
      // Extract workstream data from conversation
      const lowerMessage = messageText.toLowerCase();
      const lowerReply = data.reply.toLowerCase();
      
      // Update workstream data based on context
      if (lowerReply.includes('area of work') || lowerReply.includes('workstream')) {
        setWorkstreamData(prev => ({ ...prev, workstream_type: messageText }));
      } else if (lowerReply.includes('budget') || lowerReply.includes('team')) {
        setWorkstreamData(prev => ({ ...prev, pl_context: messageText }));
      } else if (lowerReply.includes('vision')) {
        setWorkstreamData(prev => ({ ...prev, vision_template: messageText }));
      } else if (lowerReply.includes('mission')) {
        setWorkstreamData(prev => ({ ...prev, mission_template: messageText }));
      } else if (lowerReply.includes('cadence') || lowerReply.includes('rhythm')) {
        setWorkstreamData(prev => ({ ...prev, cadence_suggestion: messageText }));
      }

      // Check if workstream is complete
      if (data.reply.includes('All requirements gathered') || 
          data.reply.includes('create this workstream') ||
          data.reply.includes('create the workstream')) {
        setIsCreatingWorkstream(true);
        completeWorkstreamCreation();
      }
      
      // Handle confirmation response
      if (isCreatingWorkstream && messageText.toLowerCase().includes('yes')) {
        createWorkstream();
      }

    } catch (error) {
      console.error('Error calling Ora API:', error);
      
      // Fallback message if API fails
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        message: "I apologize, I'm having trouble connecting right now. Please try again in a moment.",
        speaker: 'ora',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkstream = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual workstream creation API call
      const mockWorkstream = {
        id: Date.now().toString(),
        name: workstreamData.workstream_type,
        ...workstreamData
      };

      // Notify parent
      window.dispatchEvent(new CustomEvent('workstream-created', { 
        detail: mockWorkstream 
      }));

      const successMessage: Message = {
        id: 'success',
        message: "🎉 Workstream created successfully! You can now start adding artefacts and building your roadmap.",
        speaker: 'ora',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Failed to create workstream:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const resetConversation = () => {
    setMessages([]);
    setCurrentStepIndex(-1);
    onStepChange('', []); // Reset parent state
    setWorkstreamData({});
    setIsCreatingWorkstream(false);
    
    // Show intro message
    const introMessage: Message = {
      id: 'intro',
      message: "Hello! I'm Ora, here to help you create a strong workstream foundation. What area of work will this workstream serve?",
      speaker: 'ora',
      created_at: new Date().toISOString()
    };
    setMessages([introMessage]);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Chat with Ora
          </div>
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConversation}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Start Over
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`flex gap-3 ${
                  msg.speaker === 'ora' ? 'justify-start' : 'justify-end'
                }`}>
                  <div className={`flex gap-3 max-w-[80%] ${
                    msg.speaker === 'ora' ? 'flex-row' : 'flex-row-reverse'
                  }`}>
                    <div className="flex-shrink-0">
                      {msg.speaker === 'ora' ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${
                      msg.speaker === 'ora'
                        ? 'bg-muted'
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {msg.isWorkstreamSummary && msg.workstreamData ? (
                        <div className="space-y-3">
                          <p className="text-sm mb-3">{msg.message}</p>
                          <WorkstreamSummary 
                            data={msg.workstreamData} 
                            onUpdate={(updatedData) => {
                              setWorkstreamData(updatedData);
                              // Update the message in the messages array
                              setMessages(prev => prev.map(m => 
                                m.id === msg.id 
                                  ? { ...m, workstreamData: updatedData }
                                  : m
                              ));
                            }}
                          />
                          <p className="text-sm mt-3">Would you like to create this workstream?</p>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {msg.patterns && msg.patterns.length > 0 && (
                  <div className="ml-11 mt-2">
                    <InlinePatternBox 
                      patterns={msg.patterns}
                      onSelect={handlePatternSelect}
                      title="Choose from successful patterns or describe your own:"
                    />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="px-6 pb-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentStepIndex === -1 ? "Type 'yes' to start..." : "Type your answer..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}