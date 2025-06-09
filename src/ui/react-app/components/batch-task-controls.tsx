"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Square, 
  CheckSquare, 
  Undo2, 
  Redo2,
  MoreHorizontal,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useUndoRedo, UndoRedoAction } from '@/lib/use-undo-redo';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'complete' | 'blocked';
  phase: string;
  workstream: string;
  tags: string[];
  uuid: string;
}

interface BatchTaskControlsProps {
  tasks: Task[];
  selectedTasks: Set<string>;
  onTaskSelectionChange: (taskId: string, selected: boolean) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onBatchEdit?: (tasks: Task[]) => void;
  onBatchDelete?: (tasks: Task[]) => void;
  onBatchAdd?: () => void;
  disabled?: boolean;
  className?: string;
}

interface BatchOperationStatus {
  isProcessing: boolean;
  results: { [operationId: string]: { success: boolean; error?: string } };
  partialFailures: string[];
}

export function BatchTaskControls({
  tasks,
  selectedTasks,
  onTaskSelectionChange,
  onSelectAll,
  onSelectNone,
  onBatchEdit,
  onBatchDelete,
  onBatchAdd,
  disabled = false,
  className = ''
}: BatchTaskControlsProps) {
  
  const undoRedo = useUndoRedo();
  const [batchStatus, setBatchStatus] = useState<BatchOperationStatus>({
    isProcessing: false,
    results: {},
    partialFailures: []
  });

  const selectedTasksArray = tasks.filter(task => selectedTasks.has(task.id));
  const hasSelections = selectedTasks.size > 0;
  const allSelected = tasks.length > 0 && selectedTasks.size === tasks.length;
  const partiallySelected = selectedTasks.size > 0 && selectedTasks.size < tasks.length;

  // Keyboard shortcuts for batch operations
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            if (tasks.length > 0 && !disabled) {
              if (allSelected) {
                onSelectNone();
              } else {
                onSelectAll();
              }
            }
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              // Ctrl+Shift+Z = Redo
              undoRedo.redo();
            } else {
              // Ctrl+Z = Undo
              undoRedo.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            // Ctrl+Y = Redo (alternative)
            undoRedo.redo();
            break;
          case 'Delete':
            e.preventDefault();
            if (hasSelections && onBatchDelete && !disabled) {
              handleBatchDelete();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [tasks, selectedTasks, allSelected, hasSelections, disabled, undoRedo, onSelectAll, onSelectNone, onBatchDelete]);

  const handleBatchDelete = useCallback(async () => {
    if (!onBatchDelete || selectedTasksArray.length === 0) return;

    setBatchStatus(prev => ({ ...prev, isProcessing: true }));

    try {
      // Create undo action before deletion
      const undoAction: Omit<UndoRedoAction, 'id' | 'timestamp'> = {
        type: 'batch_mutation',
        description: `Delete ${selectedTasksArray.length} tasks`,
        rollbackData: selectedTasksArray,
        rollbackFunction: async () => {
          // This would need to re-create the tasks
          console.log('Undo delete operation for tasks:', selectedTasksArray);
        }
      };

      undoRedo.addAction(undoAction);
      
      // Execute batch delete
      await onBatchDelete(selectedTasksArray);
      
      // Clear selections after successful delete
      onSelectNone();

    } catch (error) {
      console.error('Batch delete failed:', error);
    } finally {
      setBatchStatus(prev => ({ ...prev, isProcessing: false }));
    }
  }, [selectedTasksArray, onBatchDelete, onSelectNone, undoRedo]);

  const handleBatchEdit = useCallback(async () => {
    if (!onBatchEdit || selectedTasksArray.length === 0) return;

    setBatchStatus(prev => ({ ...prev, isProcessing: true }));

    try {
      // Create undo action before edit
      const undoAction: Omit<UndoRedoAction, 'id' | 'timestamp'> = {
        type: 'batch_mutation',
        description: `Edit ${selectedTasksArray.length} tasks`,
        rollbackData: selectedTasksArray,
        rollbackFunction: async () => {
          console.log('Undo edit operation for tasks:', selectedTasksArray);
        }
      };

      undoRedo.addAction(undoAction);
      
      // Execute batch edit
      await onBatchEdit(selectedTasksArray);

    } catch (error) {
      console.error('Batch edit failed:', error);
    } finally {
      setBatchStatus(prev => ({ ...prev, isProcessing: false }));
    }
  }, [selectedTasksArray, onBatchEdit, undoRedo]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selection Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelectAll();
                } else {
                  onSelectNone();
                }
              }}
              disabled={disabled || tasks.length === 0}
              className="data-[state=indeterminate]:bg-blue-500"
              ref={(el) => {
                if (el && partiallySelected) {
                  el.indeterminate = true;
                }
              }}
            />
            <span className="text-sm font-medium">
              {selectedTasks.size === 0 ? 'Select All' : 
               allSelected ? 'Deselect All' : 
               `${selectedTasks.size} of ${tasks.length} selected`}
            </span>
            {hasSelections && (
              <Badge variant="secondary" className="text-xs">
                Ctrl+A to toggle
              </Badge>
            )}
          </div>

          {hasSelections && (
            <div className="text-xs text-gray-500">
              Use Shift+Click to select ranges, Ctrl+Click for individual items
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {onBatchAdd && (
            <Button
              onClick={onBatchAdd}
              variant="outline"
              size="sm"
              disabled={disabled}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          )}

          {hasSelections && (
            <>
              {onBatchEdit && (
                <Button
                  onClick={handleBatchEdit}
                  variant="outline"
                  size="sm"
                  disabled={disabled || batchStatus.isProcessing}
                  className="flex items-center gap-1 hover:bg-blue-50"
                >
                  {batchStatus.isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Edit className="h-4 w-4" />
                  )}
                  Edit ({selectedTasks.size})
                </Button>
              )}

              {onBatchDelete && (
                <Button
                  onClick={handleBatchDelete}
                  variant="outline"
                  size="sm"
                  disabled={disabled || batchStatus.isProcessing}
                  className="flex items-center gap-1 hover:bg-red-50 text-red-600 hover:text-red-700"
                >
                  {batchStatus.isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete ({selectedTasks.size})
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Undo/Redo Controls */}
      <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
        <div className="flex items-center space-x-2">
          <Button
            onClick={undoRedo.undo}
            variant="ghost"
            size="sm"
            disabled={!undoRedo.canUndo || undoRedo.isUndoing}
            className="flex items-center gap-1"
          >
            {undoRedo.isUndoing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="h-4 w-4" />
            )}
            Undo
            <Badge variant="secondary" className="text-xs ml-1">
              Ctrl+Z
            </Badge>
          </Button>

          <Button
            onClick={undoRedo.redo}
            variant="ghost"
            size="sm"
            disabled={!undoRedo.canRedo || undoRedo.isRedoing}
            className="flex items-center gap-1"
          >
            {undoRedo.isRedoing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Redo2 className="h-4 w-4" />
            )}
            Redo
            <Badge variant="secondary" className="text-xs ml-1">
              Ctrl+Y
            </Badge>
          </Button>
        </div>

        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {undoRedo.getLastActionDescription() && (
            <span>Last: {undoRedo.getLastActionDescription()}</span>
          )}
          {undoRedo.undoStack.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {undoRedo.undoStack.length} actions in history
            </Badge>
          )}
        </div>
      </div>

      {/* Batch Operation Status */}
      {batchStatus.partialFailures.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Some operations failed ({batchStatus.partialFailures.length} errors)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced TaskCard with selection support
interface SelectableTaskCardProps {
  task: Task;
  selected: boolean;
  onSelectionChange: (taskId: string, selected: boolean) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  isPending?: boolean;
  isFailed?: boolean;
  className?: string;
}

export function SelectableTaskCard({
  task,
  selected,
  onSelectionChange,
  onEdit,
  onDelete,
  isPending = false,
  isFailed = false,
  className = ''
}: SelectableTaskCardProps) {
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const cardClasses = [
    'relative border rounded-lg p-4 bg-white transition-all duration-200',
    selected ? 'border-blue-500 bg-blue-50 shadow-md' : 'hover:shadow-md hover:border-gray-300',
    isPending ? 'opacity-60 animate-pulse' : '',
    isFailed ? 'border-red-500 bg-red-50' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelectionChange(task.id, !!checked)}
          className="h-4 w-4"
        />
      </div>

      {/* Content */}
      <div className="ml-8 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-lg">{task.title}</h3>
          <Badge className={getStatusColor(task.status)}>
            {task.status.replace('_', ' ')}
          </Badge>
          {isPending && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Pending
            </Badge>
          )}
          {isFailed && (
            <Badge variant="destructive">Failed</Badge>
          )}
        </div>
        
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        )}
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Phase: {task.phase}</span>
          <span>Workstream: {task.workstream}</span>
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Individual Controls */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-1 bg-white border rounded-md shadow-sm">
            {onEdit && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50"
                title="Edit task"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task);
                }}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 