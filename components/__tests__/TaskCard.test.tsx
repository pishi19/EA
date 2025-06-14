import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '@/components/TaskCard';

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span data-testid="badge" className={className} data-variant={variant} {...props}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

const mockTask = {
  id: 'task-1',
  title: 'Test Task Title',
  description: 'Test task description with details',
  status: 'in_progress' as const,
  phase: '11.2',
  workstream: 'Ora',
  tags: ['testing', 'react'],
  uuid: 'test-uuid-123'
};

const mockHandlers = {
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TaskCard Component', () => {
  it('renders task information correctly', () => {
    render(<TaskCard task={mockTask} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} />);
    
    expect(screen.getByText('Test Task Title')).toBeInTheDocument();
    expect(screen.getByText('Test task description with details')).toBeInTheDocument();
    expect(screen.getByText('11.2')).toBeInTheDocument();
    expect(screen.getByText('Ora')).toBeInTheDocument();
  });

  it('displays status badge with correct styling', () => {
    render(<TaskCard task={mockTask} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} />);
    
    const statusBadge = screen.getByTestId('badge');
    expect(statusBadge).toHaveTextContent('in_progress');
  });

  it('renders tags correctly', () => {
    render(<TaskCard task={mockTask} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} />);
    
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('shows edit and delete buttons when showControls is true', () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockHandlers.onEdit} 
        onDelete={mockHandlers.onDelete}
        showControls={true}
      />
    );
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('hides controls when showControls is false', () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockHandlers.onEdit} 
        onDelete={mockHandlers.onDelete}
        showControls={false}
      />
    );
    
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockHandlers.onEdit} 
        onDelete={mockHandlers.onDelete}
        showControls={true}
      />
    );
    
    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);
    
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onEdit).toHaveBeenCalledWith();
  });

  it('calls onDelete when delete button is clicked', async () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockHandlers.onEdit} 
        onDelete={mockHandlers.onDelete}
        showControls={true}
      />
    );
    
    const deleteButton = screen.getByText('Delete');
    await userEvent.click(deleteButton);
    
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onDelete).toHaveBeenCalledWith();
  });

  it('applies custom className correctly', () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockHandlers.onEdit} 
        onDelete={mockHandlers.onDelete}
        className="custom-class"
      />
    );
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });

  it('handles missing optional fields gracefully', () => {
    const taskWithMissingFields = {
      id: 'task-2',
      title: 'Minimal Task',
      description: '',
      status: 'complete' as const,
      phase: '',
      workstream: '',
      tags: [],
      uuid: 'uuid-2'
    };

    render(
      <TaskCard 
        task={taskWithMissingFields} 
        onEdit={mockHandlers.onEdit} 
        onDelete={mockHandlers.onDelete}
      />
    );
    
    expect(screen.getByText('Minimal Task')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveTextContent('complete');
  });

  it('displays different status styles correctly', () => {
    const tasks = [
      { ...mockTask, status: 'complete' as const },
      { ...mockTask, status: 'blocked' as const },
      { ...mockTask, status: 'planning' as const },
    ];

    tasks.forEach((task, index) => {
      const { unmount } = render(
        <TaskCard 
          task={task} 
          onEdit={mockHandlers.onEdit} 
          onDelete={mockHandlers.onDelete}
        />
      );
      
      const statusBadge = screen.getByTestId('badge');
      expect(statusBadge).toHaveTextContent(task.status);
      
      unmount();
    });
  });

  it('handles long text content appropriately', () => {
    const taskWithLongContent = {
      ...mockTask,
      title: 'Very long task title that might overflow the container and need truncation',
      description: 'Very long description that contains a lot of detailed information about the task and should be handled appropriately by the component layout and styling systems'
    };

    render(
      <TaskCard 
        task={taskWithLongContent} 
        onEdit={mockHandlers.onEdit} 
        onDelete={mockHandlers.onDelete}
      />
    );
    
    expect(screen.getByText(taskWithLongContent.title)).toBeInTheDocument();
    expect(screen.getByText(taskWithLongContent.description)).toBeInTheDocument();
  });

  it('renders without crashing when handlers are undefined', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task Title')).toBeInTheDocument();
  });

  it('supports keyboard navigation for accessibility', async () => {
    render(
      <TaskCard 
        task={mockTask} 
        onEdit={mockHandlers.onEdit} 
        onDelete={mockHandlers.onDelete}
        showControls={true}
      />
    );
    
    const editButton = screen.getByText('Edit');
    editButton.focus();
    
    expect(editButton).toHaveFocus();
    
    // Test keyboard interaction
    fireEvent.keyDown(editButton, { key: 'Enter' });
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
  });

  it('displays task metadata correctly', () => {
    render(<TaskCard task={mockTask} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} />);
    
    // Check that phase and workstream are displayed
    expect(screen.getByText('11.2')).toBeInTheDocument();
    expect(screen.getByText('Ora')).toBeInTheDocument();
    
    // Check that UUID is displayed (might be truncated)
    expect(screen.getByText(/test-uuid-123/)).toBeInTheDocument();
  });
}); 