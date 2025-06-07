"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, AlertTriangle } from "lucide-react";

// --- Type Definitions ---
interface ValidationStatus {
  isValid: boolean;
  missingRequiredSections: string[];
  errors: string[];
}

interface SourceLoop {
  uuid: string;
  title: string;
  phase: string | number;
  workstream: string;
  tags: string[];
  validation?: ValidationStatus;
}

interface MemoryTrace {
    description: string;
    timestamp: string;
    status: 'completed' | 'executed';
    executor: 'user' | 'system';
    output?: string;
}

interface Task {
  id: string;
  description: string;
  is_complete: boolean;
  source_loop: SourceLoop;
  memory_traces?: MemoryTrace[];
  origin?: string;
}

type TaskResult = {
  taskId: string;
  status: "running" | "success" | "error";
  result?: string;
};

// --- Main Component ---
export default function TaskExecutor() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResults, setTaskResults] = useState<Record<string, TaskResult>>({});
  const [workstreamFilter, setWorkstreamFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [editingSuggestion, setEditingSuggestion] = useState<Record<string, string>>({});

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // --- Filtering Logic ---
  const workstreams = useMemo(() => ["all", ...Array.from(new Set(tasks.map(t => t.source_loop.workstream).filter(Boolean)))], [tasks]);
  const phases = useMemo(() => ["all", ...Array.from(new Set(tasks.map(t => String(t.source_loop.phase)).filter(Boolean)))], [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const workstreamMatch = workstreamFilter === "all" || task.source_loop.workstream === workstreamFilter;
      const phaseMatch = phaseFilter === "all" || String(task.source_loop.phase) === phaseFilter;
      return workstreamMatch && phaseMatch;
    });
  }, [tasks, workstreamFilter, phaseFilter]);

  const handleSuggestNextStep = async (loopId: string) => {
    try {
        const response = await fetch('/api/suggest-next-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loopId }),
        });
        if (!response.ok) {
            throw new Error('Failed to get suggestion');
        }
        const { suggestion } = await response.json();
        setSuggestions(prev => ({...prev, [loopId]: suggestion}));
    } catch (error) {
        console.error(error);
    }
  };

  const handlePromoteSuggestion = async (loopId: string) => {
    const suggestion = editingSuggestion[loopId];
    if (!suggestion) return;

    try {
      const response = await fetch('/api/promote-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loopId, taskDescription: suggestion }),
      });

      if (!response.ok) {
        throw new Error('Failed to promote suggestion');
      }

      setSuggestions(prev => {
        const newSuggestions = { ...prev };
        delete newSuggestions[loopId];
        return newSuggestions;
      });
      setEditingSuggestion(prev => {
        const newEditing = { ...prev };
        delete newEditing[loopId];
        return newEditing;
      });
      await fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddTask = async (loopId: string, description: string) => {
    try {
      const response = await fetch('/api/promote-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: { 
            description,
            added_by: 'user', 
            source: `manual_addition: ${loopId}`
          },
          destinationType: 'existing-loop',
          destinationId: loopId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add new task');
      }
      await fetchTasks();
    } catch (error) {
      console.error('Failed to add task:', error);
      // In a real app, show a toast notification
    }
  };

  // --- Event Handlers ---
  const handleRunTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTaskResults(prev => ({ ...prev, [taskId]: { taskId, status: "running" } }));

    try {
      const response = await fetch('/api/run-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loopId: task.source_loop.uuid,
          taskDescription: task.description,
          loopTitle: task.source_loop.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to run task');
      }

      const { result } = await response.json();
      
      setTaskResults(prev => ({
        ...prev,
        [taskId]: {
          taskId,
          status: "success",
          result: result,
        },
      }));

    } catch (error) {
      console.error(error);
      setTaskResults(prev => ({
        ...prev,
        [taskId]: {
          taskId,
          status: "error",
          result: error instanceof Error ? error.message : "An unknown error occurred.",
        },
      }));
    }
    await fetchTasks(); // Refetch tasks to get new memory trace
  };

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await fetch('/api/complete-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loopId: task.source_loop.uuid,
          taskDescription: task.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete task');
      }

      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, is_complete: true } : t
        )
      );
    } catch (error) {
      console.error(error);
      // Here you could add a state to show an error message in the UI
    }
    await fetchTasks(); // Refetch tasks to get new memory trace
  };

  // --- UI Helpers ---
  const getResultColor = (status?: "running" | "success" | "error") => {
    if (status === "success") return "text-green-500";
    if (status === "error") return "text-red-500";
    return "text-gray-500";
  };

  const groupedTasks = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
        const loopId = task.source_loop.uuid;
        if (!acc[loopId]) {
            acc[loopId] = {
                ...task.source_loop,
                tasks: [],
            };
        }
        acc[loopId].tasks.push(task);
        return acc;
    }, {} as Record<string, SourceLoop & {tasks: Task[]}>);
  }, [filteredTasks]);

  // --- Render ---
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Contextual Task Executor</h1>
      
      {/* Filters */}
      <div className="flex space-x-4 mb-6 p-4 border rounded-lg bg-slate-50">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Workstream</label>
          <Select value={workstreamFilter} onValueChange={setWorkstreamFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select workstream" />
            </SelectTrigger>
            <SelectContent>
              {workstreams.map(ws => <SelectItem key={ws} value={ws}>{ws}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Phase</label>
          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select phase" />
            </SelectTrigger>
            <SelectContent>
              {phases.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading tasks...</p>
      ) : (
        <div className="space-y-8">
            {Object.values(groupedTasks).map((group) => (
                <div key={group.uuid}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold">{group.title}</h2>
                            {group.validation && !group.validation.isValid && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Incomplete Loop
                                </Badge>
                            )}
                        </div>
                        <div className="flex space-x-2">
                            <AddTaskDialog loopId={group.uuid} onAddTask={handleAddTask} />
                            <Button variant="outline" onClick={() => handleSuggestNextStep(group.uuid)}>Suggest Task</Button>
                        </div>
                    </div>
                    {group.validation && !group.validation.isValid && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Loop Structure Warning</AlertTitle>
                            <AlertDescription>
                                This loop file is missing required sections:
                                <ul className="mt-2 ml-4 list-disc">
                                    {group.validation.missingRequiredSections.map(section => (
                                        <li key={section} className="text-sm">{section}</li>
                                    ))}
                                </ul>
                                <p className="mt-2 text-sm">
                                    Tasks from this loop may not display correctly. Please update the loop file structure.
                                </p>
                            </AlertDescription>
                        </Alert>
                    )}
                    {suggestions[group.uuid] && (
                        <Alert className="mb-4">
                            <AlertTitle>Suggested Task</AlertTitle>
                            <AlertDescription>
                                <Input
                                    value={editingSuggestion[group.uuid] ?? suggestions[group.uuid]}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingSuggestion(prev => ({ ...prev, [group.uuid]: e.target.value }))}
                                    className="mb-2"
                                />
                                <div className="flex justify-end space-x-2">
                                    <Button variant="ghost" onClick={() => setSuggestions(prev => {
                                        const newSuggestions = { ...prev };
                                        delete newSuggestions[group.uuid];
                                        return newSuggestions;
                                    })}>Discard</Button>
                                    <Button onClick={() => handlePromoteSuggestion(group.uuid)}>Accept</Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4">
                        {group.tasks.map(task => (
                            <Card key={task.id} className={task.is_complete ? "bg-gray-50" : ""}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {task.description}
                                          {task.origin === 'gpt' && <Badge variant="secondary">GPT</Badge>}
                                          {task.origin === 'plan' && <Badge variant="outline">Plan</Badge>}
                                        </div>
                                        {task.memory_traces && task.memory_traces.length > 0 && <Badge variant="secondary">Has Memory</Badge>}
                                    </CardTitle>
                                    <CardDescription>
                                        From Loop: <strong>{task.source_loop.title}</strong> (Phase: {task.source_loop.phase}, Workstream: {task.source_loop.workstream})
                                        <br/>
                                        <span className="text-xs text-gray-500">UUID: {task.source_loop.uuid}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible>
                                        <AccordionItem value={task.id}>
                                            <AccordionTrigger>Execution Details</AccordionTrigger>
                                            <AccordionContent>
                                                {taskResults[task.id] && (
                                                    <div className="mt-4 p-2 border rounded-md">
                                                        <p className="font-semibold">Status: <span className={getResultColor(taskResults[task.id]?.status)}>{taskResults[task.id].status}</span></p>
                                                        {taskResults[task.id].result && <p className="mt-2 text-sm">{taskResults[task.id].result}</p>}
                                                    </div>
                                                )}
                                                {(task.memory_traces && task.memory_traces.length > 0) && (
                                                     <div className="mt-4">
                                                        <h4 className="font-semibold">Memory Trace</h4>
                                                        <div className="space-y-2 mt-2">
                                                            {task.memory_traces.map((trace, index) => (
                                                                <div key={index} className="text-xs p-2 border rounded bg-slate-100">
                                                                    <p><strong>Status:</strong> {trace.status} by {trace.executor} at {new Date(trace.timestamp).toLocaleString()}</p>
                                                                    {trace.output && <p className="mt-1 font-mono">{trace.output}</p>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </CardContent>
                                <CardFooter className="space-x-2">
                                    <Button onClick={() => handleRunTask(task.id)} disabled={taskResults[task.id]?.status === "running" || task.is_complete}>
                                        {task.is_complete ? "Completed" : taskResults[task.id]?.status === "running" ? "Running..." : "Run"}
                                    </Button>
                                    {!task.is_complete && (
                                        <Button variant="secondary" onClick={() => handleCompleteTask(task.id)} disabled={taskResults[task.id]?.status === 'running'}>
                                            Complete
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
          {Object.keys(groupedTasks).length === 0 && !isLoading && (
            <p className="text-center text-gray-500 py-8">No tasks match the current filter criteria.</p>
          )}
        </div>
      )}
    </div>
  );
}

// --- Add Task Dialog Component ---
const AddTaskDialog = ({ loopId, onAddTask }: { loopId: string; onAddTask: (loopId: string, description: string) => void; }) => {
    const [description, setDescription] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description) return;
        setIsAdding(true);
        await onAddTask(loopId, description);
        setIsAdding(false);
        setDescription('');
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Task</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Task to Loop</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Task Description
                        </label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isAdding}>
                            {isAdding ? 'Adding...' : 'Add Task'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}; 