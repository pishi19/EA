import React from 'react';
import { render, screen } from '@testing-library/react';
import { BatchTaskControls, SelectableTaskCard } from '../batch-task-controls';

// Mock the undo-redo hook
jest.mock('@/lib/use-undo-redo', () => ({
  useUndoRedo: () => ({
    canUndo: true,
    canRedo: false,
    isUndoing: false,
    isRedoing: false,
    undoStack: [{ description: 'Last action' }],
    redoStack: [],
    addAction: jest.fn(),
    undo: jest.fn().mockResolvedValue(true),
    redo: jest.fn().mockResolvedValue(false),
    clearHistory: jest.fn(),
    getLastActionDescription: () => 'Last action',
    getNextRedoDescription: () => null
  })
}));

const mockTasks = [
  {
    id: 'task1',
    title: 'Task 1',
    description: 'Description 1',
    status: 'planning' as const,
    phase: '11.2',
    workstream: 'workstream-ui',
    tags: ['tag1'],
    uuid: 'uuid1'
  }
];

describe('BatchTaskControls', () => {
  const defaultProps = {
    tasks: mockTasks,
    selectedTasks: new Set<string>(),
    onTaskSelectionChange: jest.fn(),
    onSelectAll: jest.fn(),
    onSelectNone: jest.fn(),
    onBatchEdit: jest.fn(),
    onBatchDelete: jest.fn(),
    onBatchAdd: jest.fn()
  };

  it('renders selection controls correctly', () => {
    render(<BatchTaskControls {...defaultProps} />);
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('shows undo/redo controls', () => {
    render(<BatchTaskControls {...defaultProps} />);
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
  });
});

describe('SelectableTaskCard', () => {
  const defaultProps = {
    task: mockTasks[0],
    selected: false,
    onSelectionChange: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn()
  };

  it('renders task information correctly', () => {
    render(<SelectableTaskCard {...defaultProps} />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });
}); 