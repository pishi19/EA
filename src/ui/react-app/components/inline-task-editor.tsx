"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';

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

interface InlineTaskEditorProps {
  task?: Task;
  mode: 'add' | 'edit' | 'view';
  onSave: (task: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'complete', label: 'Complete', color: 'bg-green-100 text-green-800' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800' },
];

export function InlineTaskEditor({ 
  task, 
  mode, 
  onSave, 
  onDelete, 
  onCancel, 
  isLoading = false, 
  error = null 
}: InlineTaskEditorProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'planning',
    phase: task?.phase || '',
    workstream: task?.workstream || '',
    tags: task?.tags || [],
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title input when component mounts in edit/add mode
  useEffect(() => {
    if ((mode === 'add' || mode === 'edit') && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'Enter':
            e.preventDefault();
            handleSave();
            break;
        }
      }
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (mode === 'add' || mode === 'edit') {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [mode, formData]);

  const handleInputChange = (field: keyof Task, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      const newTags = [...(formData.tags || []), tagInput.trim()];
      setFormData(prev => ({ ...prev, tags: newTags }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = formData.tags?.filter(tag => tag !== tagToRemove) || [];
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (err) {
      // Error handled by parent component
    }
  };

  const handleDelete = async () => {
    if (task?.id && onDelete) {
      try {
        await onDelete(task.id);
        setShowDeleteConfirm(false);
      } catch (err) {
        // Error handled by parent component
      }
    }
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(opt => opt.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  if (mode === 'view' && task) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-lg">{task.title}</h3>
              <Badge className={getStatusColor(task.status)}>
                {STATUS_OPTIONS.find(opt => opt.value === task.status)?.label}
              </Badge>
            </div>
            
            {task.description && (
              <p className="text-sm text-gray-600">{task.description}</p>
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
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg p-4 bg-gray-50">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <Input
              ref={titleInputRef}
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title..."
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description..."
              disabled={isLoading}
              className="w-full min-h-20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phase
              </label>
              <Input
                value={formData.phase}
                onChange={(e) => handleInputChange('phase', e.target.value)}
                placeholder="e.g., 11.2.2"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workstream
              </label>
              <Input
                value={formData.workstream}
                onChange={(e) => handleInputChange('workstream', e.target.value)}
                placeholder="e.g., roadmap-vertical-slice"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                onClick={handleAddTag}
                disabled={!tagInput.trim() || isLoading}
                variant="outline"
                size="sm"
              >
                Add
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-gray-300"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-gray-500">
              Press Ctrl+S or Ctrl+Enter to save, Escape to cancel
            </div>
            <div className="flex gap-2">
              {mode === 'edit' && onDelete && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.title?.trim() || isLoading}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 my-4">
            Are you sure you want to delete "{task?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 