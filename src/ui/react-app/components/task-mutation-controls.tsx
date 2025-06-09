"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface TaskMutationControlsProps {
  task?: Task;
  showAddButton?: boolean;
  onAdd?: () => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  disabled?: boolean;
  size?: 'sm' | 'lg';
  variant?: 'inline' | 'overlay' | 'sidebar';
}

const STATUS_COLORS = {
  planning: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  complete: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
};

export function TaskMutationControls({
  task,
  showAddButton = false,
  onAdd,
  onEdit,
  onDelete,
  disabled = false,
  size = 'sm',
  variant = 'inline'
}: TaskMutationControlsProps) {

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            if (showAddButton && onAdd && !disabled) {
              onAdd();
            }
            break;
          case 'e':
            e.preventDefault();
            if (task && onEdit && !disabled) {
              onEdit(task);
            }
            break;
        }
      }
      
      if (e.key === 'Delete' && task && onDelete && !disabled) {
        e.preventDefault();
        onDelete(task);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [task, onAdd, onEdit, onDelete, showAddButton, disabled]);

  const buttonSize = size === 'lg' ? 'default' : 'sm';
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  if (variant === 'overlay' && task) {
    return (
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
              disabled={disabled}
              className="h-8 w-8 p-0 hover:bg-blue-50"
              title="Edit task (Ctrl+E)"
            >
              <Edit className={iconSize} />
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
              disabled={disabled}
              className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
              title="Delete task (Delete key)"
            >
              <Trash2 className={iconSize} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="flex flex-col gap-2 w-full">
        {showAddButton && onAdd && (
          <Button
            onClick={onAdd}
            variant="outline"
            size={buttonSize}
            disabled={disabled}
            className="w-full justify-start"
          >
            <Plus className={`${iconSize} mr-2`} />
            Add New Task
            <Badge variant="secondary" className="ml-auto text-xs">
              Ctrl+N
            </Badge>
          </Button>
        )}
        
        {task && (
          <>
            {onEdit && (
              <Button
                onClick={() => onEdit(task)}
                variant="outline"
                size={buttonSize}
                disabled={disabled}
                className="w-full justify-start"
              >
                <Edit className={`${iconSize} mr-2`} />
                Edit Task
                <Badge variant="secondary" className="ml-auto text-xs">
                  Ctrl+E
                </Badge>
              </Button>
            )}
            
            {onDelete && (
              <Button
                onClick={() => onDelete(task)}
                variant="outline"
                size={buttonSize}
                disabled={disabled}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className={`${iconSize} mr-2`} />
                Delete Task
                <Badge variant="secondary" className="ml-auto text-xs">
                  Del
                </Badge>
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  // Default inline variant
  return (
    <div className="flex items-center gap-1">
      {showAddButton && onAdd && (
        <Button
          onClick={onAdd}
          variant="outline"
          size={buttonSize}
          disabled={disabled}
          className="flex items-center gap-1"
          title="Add new task (Ctrl+N)"
        >
          <Plus className={iconSize} />
          {size === 'lg' && 'Add Task'}
        </Button>
      )}
      
      {task && (
        <>
          {onEdit && (
            <Button
              onClick={() => onEdit(task)}
              variant="ghost"
              size={buttonSize}
              disabled={disabled}
              className="flex items-center gap-1 hover:bg-blue-50"
              title="Edit task (Ctrl+E)"
            >
              <Edit className={iconSize} />
              {size === 'lg' && 'Edit'}
            </Button>
          )}
          
          {onDelete && (
            <Button
              onClick={() => onDelete(task)}
              variant="ghost"
              size={buttonSize}
              disabled={disabled}
              className="flex items-center gap-1 hover:bg-red-50 text-red-600 hover:text-red-700"
              title="Delete task (Delete key)"
            >
              <Trash2 className={iconSize} />
              {size === 'lg' && 'Delete'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// Enhanced task card component that incorporates mutation controls
interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  className?: string;
  showControls?: boolean;
}

export function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  className = '', 
  showControls = true 
}: TaskCardProps) {
  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`relative border rounded-lg p-4 bg-white hover:shadow-md transition-shadow group ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-lg">{task.title}</h3>
            <Badge className={getStatusColor(task.status)}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Phase: {task.phase}</span>
            <span>Workstream: {task.workstream}</span>
          </div>
          
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {showControls && (onEdit || onDelete) && (
        <TaskMutationControls
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          variant="overlay"
        />
      )}
    </div>
  );
} 