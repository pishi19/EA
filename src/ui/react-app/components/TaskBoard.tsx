"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, MessageSquare, PlusCircle, ArrowUpCircle, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// --- Type Definitions ---
interface Task {
    id: string;
    description: string;
    added_by: 'user' | 'ora';
    status: 'pending' | 'done' | 'rejected' | 'promoted';
    source: string;
    context?: string;
    section: 'User-Defined Tasks' | 'Ora-Suggested Tasks';
    promoted_to?: string;
}

interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'assistant' | 'system';
    timestamp: Date;
}

// --- API Functions ---
const api = {
    getTasks: async () => {
        const res = await fetch('/api/plan-tasks');
        if (!res.ok) throw new Error('Failed to fetch tasks');
        return res.json();
    },
    addTask: async (task: Omit<Task, 'id' | 'status' | 'source' | 'section'>) => {
        const res = await fetch('/api/plan-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
        });
        if (!res.ok) throw new Error('Failed to add task');
        return res.json();
    },
    updateTask: async (task: Task) => {
        const res = await fetch('/api/plan-tasks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
        });
        if (!res.ok) throw new Error('Failed to update task');
        return res.json();
    },
    deleteTask: async (id: string) => {
        const res = await fetch('/api/plan-tasks', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error('Failed to delete task');
        return res.json();
    },
    getLoops: async () => {
        const res = await fetch('/api/loops');
        if (!res.ok) throw new Error('Failed to fetch loops');
        return res.json();
    },
    getProjectTaskFiles: async () => {
        const res = await fetch('/api/project-task-files');
        if (!res.ok) throw new Error('Failed to fetch project task files');
        return res.json();
    },
    promoteTask: async (promotionDetails: {
        task: Task;
        destinationType: 'new-loop' | 'existing-loop' | 'project-task-file';
        destinationId: string;
    }) => {
        const res = await fetch('/api/promote-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promotionDetails)
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to promote task');
        }
        return res.json();
    },
};


// --- Sub-components ---
const AddTaskForm = ({ onTaskAdded }: { onTaskAdded: () => void }) => {
    const [description, setDescription] = useState('');
    const [addedBy, setAddedBy] = useState<'user' | 'ora'>('user');
    const [context, setContext] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description) return;
        setIsAdding(true);
        try {
            await api.addTask({ description, added_by: addedBy, context });
            setDescription('');
            setContext('');
            onTaskAdded();
        } catch (error) {
            console.error(error); // In a real app, show a toast notification
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Task</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="added_by" className="block text-sm font-medium text-gray-700">Added By</label>
                        <Select value={addedBy} onValueChange={(value: 'user' | 'ora') => setAddedBy(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="ora">Ora</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="context" className="block text-sm font-medium text-gray-700">Context (Optional)</label>
                        <Input id="context" value={context} onChange={(e) => setContext(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={isAdding}>{isAdding ? 'Adding...' : 'Add Task'}</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// --- Task Chat Dialog ---
const TaskChatDialog = ({ task, isOpen, onOpenChange }: { task: Task; isOpen: boolean; onOpenChange: (isOpen: boolean) => void; }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Initialize chat with context about the task
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const contextMessage: ChatMessage = {
                id: 'context-1',
                content: `Chat started for task: "${task.description}"
                
Task Details:
• Status: ${task.status}
• Added by: ${task.added_by}  
• Source: ${task.source}
• Section: ${task.section}
${task.context ? `• Context: ${task.context}` : ''}
${task.promoted_to ? `• Promoted to: ${task.promoted_to}` : ''}

How can I help you with this task?`,
                sender: 'system',
                timestamp: new Date()
            };
            setMessages([contextMessage]);
        }
    }, [isOpen, task, messages.length]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            content: newMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        setIsSending(true);

        try {
            // Create context for the chat API
            const chatContext = {
                taskId: task.id,
                taskDescription: task.description,
                taskStatus: task.status,
                taskAddedBy: task.added_by,
                taskSource: task.source,
                taskContext: task.context,
                taskSection: task.section,
                promotedTo: task.promoted_to
            };

            const response = await fetch('/api/task-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: newMessage,
                    context: chatContext,
                    conversationHistory: messages.filter(m => m.sender !== 'system').slice(-5) // Last 5 messages for context
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get chat response');
            }

            const data = await response.json();
            
            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                content: data.content || "I'm here to help with your task. Could you please clarify what you need assistance with?",
                sender: 'assistant',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                content: "I'm having trouble connecting right now. Please try again in a moment.",
                sender: 'assistant',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTimestamp = (timestamp: Date) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Task Chat
                    </DialogTitle>
                    <CardDescription className="truncate">
                        {task.description}
                    </CardDescription>
                </DialogHeader>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-md bg-gray-50">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                    message.sender === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : message.sender === 'system'
                                        ? 'bg-gray-200 text-gray-700 text-sm'
                                        : 'bg-white border shadow-sm'
                                }`}
                            >
                                <div className="whitespace-pre-wrap">{message.content}</div>
                                <div className={`text-xs mt-1 ${
                                    message.sender === 'user' 
                                        ? 'text-blue-100' 
                                        : 'text-gray-500'
                                }`}>
                                    {formatTimestamp(message.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isSending && (
                        <div className="flex justify-start">
                            <div className="bg-white border shadow-sm rounded-lg p-3 max-w-[80%]">
                                <div className="flex items-center space-x-2">
                                    <div className="animate-pulse">Thinking...</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2 pt-4">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about this task, request changes, or get suggestions..."
                        className="flex-1 min-h-[60px] resize-none"
                        disabled={isSending}
                    />
                    <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || isSending}
                        size="icon"
                        className="h-[60px] w-12"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const TaskItem = ({ task, onUpdate, onDelete, onPromote }: { task: Task; onUpdate: (task: Task) => void; onDelete: (id: string) => void; onPromote: (task: Task) => void; }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState(task.description);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleToggleStatus = () => {
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        onUpdate({ ...task, status: newStatus });
    };

    const handleSave = () => {
        onUpdate({ ...task, description: editedDescription });
        setIsEditing(false);
    };

    return (
        <>
            <Card className={`transition-opacity ${task.status === 'done' ? 'opacity-60' : ''}`}>
                <CardContent className="p-4 flex items-start space-x-4">
                    <Checkbox checked={task.status === 'done'} onCheckedChange={handleToggleStatus} className="mt-1" />
                    <div className="flex-1 space-y-2">
                        {isEditing ? (
                            <div className="flex items-center space-x-2">
                                <Input value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} />
                                <Button onClick={handleSave} size="sm">Save</Button>
                                <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">Cancel</Button>
                            </div>
                        ) : (
                            <p className={`leading-snug ${task.status === 'done' ? 'line-through' : ''}`}>{task.description}</p>
                        )}
                        <div className="text-xs text-muted-foreground space-x-4">
                            <span>Added by: <Badge variant="secondary">{task.added_by}</Badge></span>
                            <span>Source: <Badge variant="outline">{task.source}</Badge></span>
                            {task.promoted_to && <span>Promoted to: <Badge variant="default">{task.promoted_to}</Badge></span>}
                            {task.context && <span>Context: {task.context}</span>}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {task.status !== 'done' && !task.promoted_to && <Button variant="ghost" size="icon" onClick={() => onPromote(task)} title="Promote to Execution"><ArrowUpCircle className="h-4 w-4 text-green-500" /></Button>}
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(true)} title="Chat about this task"><MessageSquare className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                </CardContent>
            </Card>
            
            <TaskChatDialog 
                task={task} 
                isOpen={isChatOpen} 
                onOpenChange={setIsChatOpen} 
            />
        </>
    );
};

// --- Promotion Dialog ---
interface Loop {
    id: string;
    name: string;
}

interface ProjectTaskFile {
    id: string;
    name: string;
}

const PromotionDialog = ({ isOpen, onOpenChange, task, onPromotionSuccess }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; task: Task; onPromotionSuccess: () => void; }) => {
    const [destinationType, setDestinationType] = useState<'existing-loop' | 'new-loop' | 'project-task-file'>('existing-loop');
    const [loops, setLoops] = useState<Loop[]>([]);
    const [projectTaskFiles, setProjectTaskFiles] = useState<ProjectTaskFile[]>([]);
    const [selectedLoop, setSelectedLoop] = useState('');
    const [selectedProjectTaskFile, setSelectedProjectTaskFile] = useState('');
    const [newLoopName, setNewLoopName] = useState('');
    const [isPromoting, setIsPromoting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            api.getLoops().then(setLoops).catch(err => setError('Failed to load loops.'));
            api.getProjectTaskFiles().then(setProjectTaskFiles).catch(err => setError('Failed to load project task files.'));
        }
    }, [isOpen]);

    const handlePromote = async () => {
        setError(null);
        setIsPromoting(true);
        
        let destinationId = '';
        switch (destinationType) {
            case 'existing-loop':
                destinationId = selectedLoop;
                break;
            case 'new-loop':
                destinationId = newLoopName;
                break;
            case 'project-task-file':
                destinationId = selectedProjectTaskFile;
                break;
        }

        if (!destinationId) {
            setError('Please select a destination.');
            setIsPromoting(false);
            return;
        }
        try {
            await api.promoteTask({ task, destinationType, destinationId });
            onPromotionSuccess();
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsPromoting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Promote Task to Execution</DialogTitle>
                    <CardDescription>"{task.description}"</CardDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Select value={destinationType} onValueChange={(v: any) => setDestinationType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="existing-loop">Promote to existing loop</SelectItem>
                            <SelectItem value="new-loop">Promote to new loop</SelectItem>
                            <SelectItem value="project-task-file">Promote to project task file</SelectItem>
                        </SelectContent>
                    </Select>

                    {destinationType === 'existing-loop' && (
                         <Select value={selectedLoop} onValueChange={setSelectedLoop}>
                            <SelectTrigger><SelectValue placeholder="Select a loop..." /></SelectTrigger>
                            <SelectContent>
                                {loops.map(loop => <SelectItem key={loop.id} value={loop.id}>{loop.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}

                    {destinationType === 'project-task-file' && (
                         <Select value={selectedProjectTaskFile} onValueChange={setSelectedProjectTaskFile}>
                            <SelectTrigger><SelectValue placeholder="Select a project task file..." /></SelectTrigger>
                            <SelectContent>
                                {projectTaskFiles.map(file => <SelectItem key={file.id} value={file.id}>{file.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}

                    {destinationType === 'new-loop' && (
                        <Input 
                            placeholder="Enter new loop name (e.g., loop-2024-09-02-new-feature)"
                            value={newLoopName}
                            onChange={e => setNewLoopName(e.target.value)}
                        />
                    )}
                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                </div>
                <div className="flex justify-end space-x-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handlePromote} disabled={isPromoting}>
                        {isPromoting ? 'Promoting...' : 'Promote'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};


// --- Main Component ---
export default function TaskBoard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
    const [selectedTaskToPromote, setSelectedTaskToPromote] = useState<Task | null>(null);

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedTasks = await api.getTasks();
            setTasks(fetchedTasks);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleUpdateTask = async (updatedTask: Task) => {
        try {
            await api.updateTask(updatedTask);
            setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        } catch (error) {
            console.error(error); // Show toast
        }
    };
    
    const handleDeleteTask = async (id: string) => {
        try {
            await api.deleteTask(id);
            setTasks(prevTasks => prevTasks.filter(t => t.id !== id));
        } catch (error) {
            console.error(error); // Show toast
        }
    };

    const handleOpenPromotionDialog = (task: Task) => {
        setSelectedTaskToPromote(task);
        setIsPromotionDialogOpen(true);
    };

    if (isLoading) return <div className="container p-4">Loading Task Board...</div>;
    if (error) return <div className="container p-4 text-red-500">Error: {error}</div>;

    const userTasks = tasks.filter(t => t.section === 'User-Defined Tasks');
    const oraTasks = tasks.filter(t => t.section === 'Ora-Suggested Tasks');

    return (
        <>
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Workstream Task Board</h1>
                <AddTaskForm onTaskAdded={fetchTasks} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4">User-Defined Tasks</h2>
                    <div className="space-y-4">
                        {userTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onPromote={handleOpenPromotionDialog} />)}
                    </div>
                </section>
                <section>
                    <h2 className="text-xl font-semibold mb-4">Ora-Suggested Tasks</h2>
                     <div className="space-y-4">
                        {oraTasks.map(task => <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onPromote={handleOpenPromotionDialog} />)}
                    </div>
                </section>
            </div>
        </div>
        {selectedTaskToPromote && (
            <PromotionDialog
                isOpen={isPromotionDialogOpen}
                onOpenChange={setIsPromotionDialogOpen}
                task={selectedTaskToPromote}
                onPromotionSuccess={() => {
                    fetchTasks();
                    setSelectedTaskToPromote(null);
                }}
            />
        )}
        </>
    );
} 