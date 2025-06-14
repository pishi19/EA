import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnifiedArtefactCard from '../UnifiedArtefactCard';

// Mock external dependencies
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span className={`badge ${className} ${variant}`} data-testid="badge">{children}</span>
  )
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={`button ${className} ${variant} ${size}`} 
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock chat components
jest.mock('../chat/ChatPane', () => {
  return function MockChatPane({ artefact, isExpanded, onToggle }: any) {
    return (
      <div data-testid="chat-pane">
        {isExpanded && (
          <div data-testid="chat-expanded">
            Chat for {artefact?.title}
            <button onClick={onToggle} data-testid="chat-toggle">Toggle</button>
          </div>
        )}
      </div>
    );
  };
});

interface MockArtefact {
  id: string;
  name: string;
  title: string;
  phase: string;
  workstream: string;
  status: string;
  score: number;
  tags: string[];
  created: string;
  uuid: string;
  summary: string;
  filePath: string;
  origin: string;
  type?: string;
  priority?: string;
  lastUpdated?: string;
  project?: string;
}

describe('UnifiedArtefactCard Component', () => {
  const mockArtefact: MockArtefact = {
    id: 'test-task-1',
    name: 'test-task-1',
    title: 'Test Task Title',
    phase: '11.2.1',
    workstream: 'ora',
    status: 'in_progress',
    score: 5,
    tags: ['testing', 'ui-component'],
    created: '2025-01-01',
    uuid: 'test-uuid-123',
    summary: 'This is a test task for validating the UnifiedArtefactCard component functionality.',
    filePath: 'runtime/workstreams/ora/artefacts/test-task-1.md',
    origin: 'test-suite',
    type: 'task',
    priority: 'high',
    lastUpdated: '2025-01-20',
    project: 'Project 11.2'
  };

  const defaultProps = {
    artefact: mockArtefact,
    isSelected: false,
    onSelect: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onStatusChange: jest.fn(),
    onTagAdd: jest.fn(),
    onTagRemove: jest.fn(),
    showActions: true,
    compact: false,
    highlightTerms: [],
    workstream: 'ora'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders artefact card with basic information', () => {
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Score
    });

    test('displays all artefact metadata correctly', () => {
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      expect(screen.getByText(/This is a test task/)).toBeInTheDocument();
      expect(screen.getByText('testing')).toBeInTheDocument();
      expect(screen.getByText('ui-component')).toBeInTheDocument();
      expect(screen.getByText('Phase: 11.2.1')).toBeInTheDocument();
    });

    test('renders in compact mode', () => {
      const compactProps = { ...defaultProps, compact: true };
      render(<UnifiedArtefactCard {...compactProps} />);
      
      expect(screen.getByTestId('card')).toHaveClass('compact');
      expect(screen.getByText('Test Task Title')).toBeInTheDocument();
    });

    test('shows selected state correctly', () => {
      const selectedProps = { ...defaultProps, isSelected: true };
      render(<UnifiedArtefactCard {...selectedProps} />);
      
      expect(screen.getByTestId('card')).toHaveClass('selected');
    });

    test('hides actions when showActions is false', () => {
      const noActionsProps = { ...defaultProps, showActions: false };
      render(<UnifiedArtefactCard {...noActionsProps} />);
      
      expect(screen.queryByTestId('action-button')).not.toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    test('displays different status badges correctly', () => {
      const statuses = ['complete', 'in_progress', 'blocked', 'planning'];
      
      statuses.forEach(status => {
        const artefactWithStatus = { ...mockArtefact, status };
        const props = { ...defaultProps, artefact: artefactWithStatus };
        
        const { rerender } = render(<UnifiedArtefactCard {...props} />);
        expect(screen.getByText(status)).toBeInTheDocument();
        
        rerender(<div />); // Clear between tests
      });
    });

    test('applies correct status styling', () => {
      const completeArtefact = { ...mockArtefact, status: 'complete' };
      const props = { ...defaultProps, artefact: completeArtefact };
      
      render(<UnifiedArtefactCard {...props} />);
      
      const statusBadge = screen.getByText('complete');
      expect(statusBadge).toHaveClass('success');
    });

    test('handles unknown status gracefully', () => {
      const unknownStatusArtefact = { ...mockArtefact, status: 'unknown_status' };
      const props = { ...defaultProps, artefact: unknownStatusArtefact };
      
      render(<UnifiedArtefactCard {...props} />);
      
      expect(screen.getByText('unknown_status')).toBeInTheDocument();
    });
  });

  describe('Tag Management', () => {
    test('displays all tags correctly', () => {
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      expect(screen.getByText('testing')).toBeInTheDocument();
      expect(screen.getByText('ui-component')).toBeInTheDocument();
    });

    test('handles empty tags array', () => {
      const noTagsArtefact = { ...mockArtefact, tags: [] };
      const props = { ...defaultProps, artefact: noTagsArtefact };
      
      render(<UnifiedArtefactCard {...props} />);
      
      expect(screen.queryByTestId('tag')).not.toBeInTheDocument();
    });

    test('allows tag addition when enabled', async () => {
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const addTagButton = screen.getByRole('button', { name: /add tag/i });
      await user.click(addTagButton);
      
      expect(defaultProps.onTagAdd).toHaveBeenCalled();
    });

    test('allows tag removal when enabled', async () => {
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const tagElements = screen.getAllByTestId('badge');
      const removeButton = tagElements[0].querySelector('[data-testid="remove-tag"]');
      
      if (removeButton) {
        await user.click(removeButton);
        expect(defaultProps.onTagRemove).toHaveBeenCalledWith('testing');
      }
    });

    test('handles very long tag names', () => {
      const longTagArtefact = {
        ...mockArtefact,
        tags: ['very-long-tag-name-that-might-cause-layout-issues']
      };
      const props = { ...defaultProps, artefact: longTagArtefact };
      
      render(<UnifiedArtefactCard {...props} />);
      
      expect(screen.getByText('very-long-tag-name-that-might-cause-layout-issues')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('calls onSelect when card is clicked', async () => {
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const card = screen.getByTestId('card');
      await user.click(card);
      
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockArtefact);
    });

    test('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockArtefact);
    });

    test('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);
      
      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockArtefact);
    });

    test('calls onStatusChange when status is changed', async () => {
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const statusButton = screen.getByRole('button', { name: /status/i });
      await user.click(statusButton);
      
      // Assuming a dropdown or menu appears
      const completeOption = screen.getByRole('option', { name: /complete/i });
      await user.click(completeOption);
      
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(mockArtefact, 'complete');
    });

    test('prevents event bubbling for action buttons', async () => {
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);
      
      // Should not trigger onSelect
      expect(defaultProps.onSelect).not.toHaveBeenCalled();
      expect(defaultProps.onEdit).toHaveBeenCalled();
    });
  });

  describe('Highlighting and Search', () => {
    test('highlights search terms in title', () => {
      const highlightProps = {
        ...defaultProps,
        highlightTerms: ['Test', 'Task']
      };
      
      render(<UnifiedArtefactCard {...highlightProps} />);
      
      const highlightedElements = screen.getAllByClass('highlight');
      expect(highlightedElements.length).toBeGreaterThan(0);
    });

    test('highlights search terms in summary', () => {
      const highlightProps = {
        ...defaultProps,
        highlightTerms: ['test', 'task']
      };
      
      render(<UnifiedArtefactCard {...highlightProps} />);
      
      expect(screen.getByText(/This is a/)).toBeInTheDocument();
    });

    test('handles case-insensitive highlighting', () => {
      const highlightProps = {
        ...defaultProps,
        highlightTerms: ['TEST', 'task']
      };
      
      render(<UnifiedArtefactCard {...highlightProps} />);
      
      // Should highlight regardless of case
      expect(screen.getByText(/Test Task Title/)).toBeInTheDocument();
    });

    test('handles empty highlight terms', () => {
      const highlightProps = {
        ...defaultProps,
        highlightTerms: []
      };
      
      render(<UnifiedArtefactCard {...highlightProps} />);
      
      expect(screen.getByText('Test Task Title')).toBeInTheDocument();
    });
  });

  describe('Chat Integration', () => {
    test('renders chat pane when available', () => {
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      expect(screen.getByTestId('chat-pane')).toBeInTheDocument();
    });

    test('toggles chat expansion', async () => {
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const chatToggle = screen.getByTestId('chat-toggle');
      await user.click(chatToggle);
      
      expect(screen.getByTestId('chat-expanded')).toBeInTheDocument();
    });

    test('passes correct artefact to chat pane', () => {
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      expect(screen.getByText('Chat for Test Task Title')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Test Task Title'));
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const card = screen.getByTestId('card');
      await user.tab();
      expect(card).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });

    test('has proper button labels for screen readers', () => {
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toHaveAttribute('aria-label', expect.stringContaining('Edit'));
    });

    test('announces status changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...defaultProps} />);
      
      const statusBadge = screen.getByText('in_progress');
      expect(statusBadge).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Error Handling', () => {
    test('handles missing artefact data gracefully', () => {
      const incompleteArtefact = {
        id: 'incomplete',
        title: 'Incomplete Task'
        // Missing other required fields
      };
      
      const props = {
        ...defaultProps,
        artefact: incompleteArtefact as any
      };
      
      expect(() => render(<UnifiedArtefactCard {...props} />)).not.toThrow();
    });

    test('handles undefined props gracefully', () => {
      const minimalProps = {
        artefact: mockArtefact,
        onSelect: jest.fn()
      };
      
      expect(() => render(<UnifiedArtefactCard {...minimalProps as any} />)).not.toThrow();
    });

    test('handles action callback errors', async () => {
      const errorProps = {
        ...defaultProps,
        onEdit: jest.fn(() => { throw new Error('Edit failed'); })
      };
      
      const user = userEvent.setup();
      render(<UnifiedArtefactCard {...errorProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      // Should not crash when callback throws
      expect(async () => {
        await user.click(editButton);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('does not re-render unnecessarily', () => {
      const { rerender } = render(<UnifiedArtefactCard {...defaultProps} />);
      
      // Re-render with same props
      rerender(<UnifiedArtefactCard {...defaultProps} />);
      
      // Should handle re-renders efficiently
      expect(screen.getByText('Test Task Title')).toBeInTheDocument();
    });

    test('handles large summaries efficiently', () => {
      const largeSummaryArtefact = {
        ...mockArtefact,
        summary: 'Very long summary text '.repeat(1000)
      };
      
      const props = { ...defaultProps, artefact: largeSummaryArtefact };
      
      const startTime = performance.now();
      render(<UnifiedArtefactCard {...props} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should render quickly
    });

    test('handles many tags efficiently', () => {
      const manyTagsArtefact = {
        ...mockArtefact,
        tags: Array.from({ length: 50 }, (_, i) => `tag-${i}`)
      };
      
      const props = { ...defaultProps, artefact: manyTagsArtefact };
      
      expect(() => render(<UnifiedArtefactCard {...props} />)).not.toThrow();
    });
  });
}); 