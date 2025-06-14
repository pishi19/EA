'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  message: string;
  speaker: 'user' | 'ora';
  created_at?: string;
}

interface ChatResponse {
  reply: string;
  suggestions?: string[];
  workstream?: any;
}

export default function OraChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Listen for messages from other components
  useEffect(() => {
    const handleOraMessage = (event: CustomEvent) => {
      if (event.detail?.message) {
        sendMessage(event.detail.message);
      }
    };

    window.addEventListener('ora-send-message', handleOraMessage as EventListener);
    return () => {
      window.removeEventListener('ora-send-message', handleOraMessage as EventListener);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch('/api/ora/chat?limit=10');
      if (response.ok) {
        const data = await response.json();
        // Reverse the order to show oldest first
        const conversations = (data.conversations || []).reverse();
        setMessages(conversations);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Add user message to chat
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
      const response = await fetch('/api/ora/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      if (response.ok) {
        const data: ChatResponse = await response.json();
        
        // Add Ora's response
        const oraMessage: Message = {
          id: (Date.now() + 1).toString(),
          message: data.reply,
          speaker: 'ora',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, oraMessage]);
        
        // Update suggestions
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }

        // If a workstream was created, notify parent
        if (data.workstream) {
          // Trigger refresh of workstreams list
          window.dispatchEvent(new CustomEvent('workstream-created', { 
            detail: data.workstream 
          }));
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestions([]);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Chat with Ora
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {isLoadingHistory && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50 animate-pulse" />
                <p className="text-muted-foreground">Loading conversation history...</p>
              </div>
            )}
            
            {!isLoadingHistory && messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Hi! I'm Ora, your workstream creation guide.</p>
                <p className="text-sm mt-2">
                  Tell me about the workstream you'd like to create.
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.speaker === 'ora' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    msg.speaker === 'ora' ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
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
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      msg.speaker === 'ora'
                        ? 'bg-muted'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    {msg.created_at && (
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(msg.created_at).toLocaleString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                          hour12: true
                        })}
                      </p>
                    )}
                  </div>
                </div>
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

        {suggestions.length > 0 && (
          <div className="mx-6 mb-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pb-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
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