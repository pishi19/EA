import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Task, Loop, ProjectTaskFile, PromoteTaskRequest, taskService } from '../services/taskService';

interface TaskPromotionDialogProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onPromote: (promotionData: PromoteTaskRequest) => Promise<void>;
}

export default function TaskPromotionDialog({ task, isOpen, onClose, onPromote }: TaskPromotionDialogProps) {
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
            const loadData = async () => {
                try {
                    const [loopsData, filesData] = await Promise.all([
                        taskService.getLoops(),
                        taskService.getProjectTaskFiles()
                    ]);
                    setLoops(loopsData);
                    setProjectTaskFiles(filesData);
                } catch (err) {
                    setError('Failed to load promotion options.');
                }
            };
            loadData();
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
            await onPromote({ 
                task, 
                destinationType, 
                destinationId 
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsPromoting(false);
        }
    };

    const resetForm = () => {
        setDestinationType('existing-loop');
        setSelectedLoop('');
        setSelectedProjectTaskFile('');
        setNewLoopName('');
        setError(null);
    };

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Promote Task to Execution</DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        "{task.description}"
                    </div>
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
                                {loops.map(loop => (
                                    <SelectItem key={loop.id} value={loop.id}>{loop.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {destinationType === 'project-task-file' && (
                         <Select value={selectedProjectTaskFile} onValueChange={setSelectedProjectTaskFile}>
                            <SelectTrigger><SelectValue placeholder="Select a project task file..." /></SelectTrigger>
                            <SelectContent>
                                {projectTaskFiles.map(file => (
                                    <SelectItem key={file.id} value={file.id}>{file.name}</SelectItem>
                                ))}
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

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
                <div className="flex justify-end space-x-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handlePromote} disabled={isPromoting}>
                        {isPromoting ? 'Promoting...' : 'Promote'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
} 