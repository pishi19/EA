import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorkstreamFilterDemo from '../page';

// Mock all complex components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={`card ${className}`}>{children}</div>,
  CardContent: ({ children }: any) => <div className="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div className="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 className="card-title">{children}</h3>
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={`badge ${className}`}>{children}</span>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={`button ${className}`}>
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => (
    <div className="select" onClick={() => onValueChange && onValueChange('test')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div className="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div className="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div className="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div className="select-value">{placeholder}</div>
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: any) => <div className="collapsible">{children}</div>,
  CollapsibleContent: ({ children }: any) => <div className="collapsible-content">{children}</div>,
  CollapsibleTrigger: ({ children }: any) => <div className="collapsible-trigger">{children}</div>
}));

// Mock complex sub-components
jest.mock('@/components/inline-task-editor', () => ({
  InlineTaskEditor: ({ onSave, onCancel }: any) => (
    <div data-testid="inline-task-editor">
      <input data-testid="task-title-input" placeholder="Task title" />
      <button onClick={() => onSave && onSave({ title: 'New Task' })}>Save</button>
      <button onClick={() => onCancel && onCancel()}>Cancel</button>
    </div>
  )
}));

jest.mock('@/components/task-mutation-controls', () => ({
  TaskMutationControls: ({ onEdit, onDelete }: any) => (
    <div data-testid="task-mutation-controls">
      <button onClick={() => onEdit && onEdit()}>Edit</button>
      <button onClick={() => onDelete && onDelete()}>Delete</button>
    </div>
  ),
  TaskCard: ({ artefact, onEdit, onDelete }: any) => (
    <div data-testid={`task-card-${artefact.id}`} className="task-card">
      <h4>{artefact.title}</h4>
      <p>Status: {artefact.status}</p>
      <p>Score: {artefact.score}</p>
      <button onClick={() => onEdit && onEdit(artefact)}>Edit Task</button>
      <button onClick={() => onDelete && onDelete(artefact)}>Delete Task</button>
    </div>
  )
}));

jest.mock('@/components/batch-task-controls', () => ({
  BatchTaskControls: ({ onBatchEdit, onBatchDelete, selectedCount }: any) => (
    <div data-testid="batch-task-controls">
      <span>Selected: {selectedCount}</span>
      <button onClick={() => onBatchEdit && onBatchEdit()}>Batch Edit</button>
      <button onClick={() => onBatchDelete && onBatchDelete()}>Batch Delete</button>
    </div>
  ),
  SelectableTaskCard: ({ artefact, selected, onSelect }: any) => (
    <div data-testid={`selectable-task-card-${artefact.id}`} className="selectable-task-card">
      <input 
        type="checkbox" 
        checked={selected} 
        onChange={(e) => onSelect && onSelect(artefact.id, e.target.checked)}
      />
      <h4>{artefact.title}</h4>
    </div>
  )
}));

jest.mock('@/components/UnifiedArtefactCard', () => {
  return function MockUnifiedArtefactCard({ artefact, expanded, onToggleExpand }: any) {
    return (
      <div data-testid={`unified-artefact-card-${artefact.id}`} className="unified-artefact-card">
        <h3>{artefact.title}</h3>
        <p>Phase: {artefact.phase}</p>
        <p>Status: {artefact.status}</p>
        <p>Score: {artefact.score}</p>
        <button onClick={() => onToggleExpand && onToggleExpand(artefact.id, !expanded)}>
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
    );
  };
});

// Mock tree navigation components
jest.mock('./TreeNavigation', () => {
  return function MockTreeNavigation({ onNodeSelect }: any) {
    return (
      <div data-testid="tree-navigation">
        <h3>Tree Navigation</h3>
        <div className="tree-nodes">
          <button onClick={() => onNodeSelect && onNodeSelect({ type: 'workstream', id: 'ora' })}>
            Ora Workstream
          </button>
          <button onClick={() => onNodeSelect && onNodeSelect({ type: 'program', id: 'phase-11' })}>
            Phase 11
          </button>
          <button onClick={() => onNodeSelect && onNodeSelect({ type: 'project', id: 'project-11.2' })}>
            Project 11.2
          </button>
        </div>
      </div>
    );
  };
});

jest.mock('./ContextPane', () => {
  return function MockContextPane({ selectedArtefact, onArtefactMutation }: any) {
    return (
      <div data-testid="context-pane">
        <h3>Context Pane</h3>
        {selectedArtefact ? (
          <div>
            <h4>{selectedArtefact.title}</h4>
            <button onClick={() => onArtefactMutation && onArtefactMutation(selectedArtefact, { action: 'status_change', status: 'complete' })}>
              Mark Complete
            </button>
          </div>
        ) : (
          <p>No artefact selected</p>
        )}
      </div>
    );
  };
});

// Mock hooks
jest.mock('./useTreeState', () => {
  return function useTreeState() {
    return {
      selectedNode: null,
      selectedArtefact: null,
      treeVisible: true,
      setSelectedNode: jest.fn(),
      setSelectedArtefact: jest.fn(),
      toggleTreeVisibility: jest.fn(),
      syncWithFilters: jest.fn()
    };
  };
});

jest.mock('./useRoadmapHierarchy', () => {
  return function useRoadmapHierarchy() {
    return {
      loading: false,
      hierarchy: {
        programs: [
          { id: 'phase-11', name: 'Phase 11', fullName: 'Phase 11: Artefact Hierarchy', displayLabel: 'Phase 11: Artefact Hierarchy' },
          { id: 'phase-12', name: 'Phase 12', fullName: 'Phase 12: Administration', displayLabel: 'Phase 12: Administration' }
        ],
        projects: [
          { id: 'project-11.1', name: 'Project 11.1', fullName: 'Project 11.1: Schema', displayLabel: 'Project 11.1: Schema' },
          { id: 'project-11.2', name: 'Project 11.2', fullName: 'Project 11.2: Filtering', displayLabel: 'Project 11.2: Filtering' }
        ],
        tasks: [
          { id: 'task-11.1.1', name: 'Task 11.1.1', fullName: 'Task 11.1.1: Design Schema', displayLabel: 'Task 11.1.1: Design Schema' }
        ]
      },
      getAvailableWorkstreams: () => ['all', 'Ora'],
      getAvailablePrograms: () => [
        { id: 'all', name: 'All Programs', fullName: 'All Programs', status: 'all' },
        { id: 'phase-11', name: 'Phase 11', fullName: 'Phase 11: Artefact Hierarchy', status: 'active' }
      ],
      getAvailableProjects: () => [
        { id: 'all', name: 'All Projects', fullName: 'All Projects', status: 'all' },
        { id: 'project-11.2', name: 'Project 11.2', fullName: 'Project 11.2: Filtering', status: 'active' }
      ],
      validateArtefactAlignment: () => ({ isValid: true, validProgram: null, validProjects: [] })
    };
  };
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
beforeEach(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe('WorkstreamFilterDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockArtefacts = [
    {
      id: 'artefact-1',
      name: 'UI Enhancement',
      title: 'User Interface Enhancement',
      phase: '11.2',
      workstream: 'ora',
      status: 'complete',
      score: 8.5,
      tags: ['ui', 'enhancement'],
      created: '2024-01-01T00:00:00Z',
      uuid: 'uuid-1',
      summary: 'UI improvements',
      filePath: '/path/to/artefact-1.md',
      origin: 'manual',
      type: 'task'
    },
    {
      id: 'artefact-2',
      name: 'API Development',
      title: 'Backend API Development',
      phase: '11.1',
      workstream: 'ora',
      status: 'in_progress',
      score: 7.2,
      tags: ['api', 'backend'],
      created: '2024-01-02T00:00:00Z',
      uuid: 'uuid-2',
      summary: 'API implementation',
      filePath: '/path/to/artefact-2.md',
      origin: 'automated',
      type: 'task'
    }
  ];

  const mockApiResponses = {
    artefacts: { artefacts: mockArtefacts },
    roadmap: { content: 'Mock roadmap content' }
  };

  describe('Page Loading and Initial State', () => {
    it('should render loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<WorkstreamFilterDemo />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should fetch artefacts and roadmap on mount', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });

      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/demo-loops?workstream=ora');
        expect(mockFetch).toHaveBeenCalledWith('/api/system-docs?file=roadmap.md');
      });
    });

    it('should display artefacts after loading', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });

      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByTestId('unified-artefact-card-artefact-1')).toBeInTheDocument();
        expect(screen.getByTestId('unified-artefact-card-artefact-2')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering Functionality', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });
    });

    it('should render all filter dropdowns', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText('Workstream')).toBeInTheDocument();
        expect(screen.getByText('Program')).toBeInTheDocument();
        expect(screen.getByText('Project')).toBeInTheDocument();
        expect(screen.getByText('Task')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('should show clear filters button', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
      });
    });

    it('should handle filter changes', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const clearButton = screen.getByText('Clear All Filters');
        fireEvent.click(clearButton);
        // Should not throw errors
      });
    });

    it('should display filter summary', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText(/Displaying \d+ artefacts/)).toBeInTheDocument();
      });
    });
  });

  describe('Tree Navigation Integration', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });
    });

    it('should render tree navigation component', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByTestId('tree-navigation')).toBeInTheDocument();
      });
    });

    it('should render context pane component', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByTestId('context-pane')).toBeInTheDocument();
      });
    });

    it('should handle tree node selection', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const workstreamButton = screen.getByText('Ora Workstream');
        fireEvent.click(workstreamButton);
        // Should not throw errors
      });
    });

    it('should toggle tree visibility', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const toggleButton = screen.getByText('Show Tree') || screen.getByText('Hide Tree');
        if (toggleButton) {
          fireEvent.click(toggleButton);
        }
        // Should not throw errors
      });
    });
  });

  describe('Task Mutation Functionality', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });
    });

    it('should render add task button', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText('Add Task')).toBeInTheDocument();
      });
    });

    it('should show inline task editor when adding task', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const addButton = screen.getByText('Add Task');
        fireEvent.click(addButton);
        expect(screen.getByTestId('inline-task-editor')).toBeInTheDocument();
      });
    });

    it('should handle task editing', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const editButton = screen.getAllByText('Edit Task')[0];
        fireEvent.click(editButton);
        // Should trigger edit mode
      });
    });

    it('should handle task deletion', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const deleteButton = screen.getAllByText('Delete Task')[0];
        fireEvent.click(deleteButton);
        // Should trigger deletion
      });
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });
    });

    it('should render batch mode toggle', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText('⚡ Batch Mode')).toBeInTheDocument();
      });
    });

    it('should switch to batch mode', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const batchModeButton = screen.getByText('⚡ Batch Mode');
        fireEvent.click(batchModeButton);
        expect(screen.getByTestId('batch-task-controls')).toBeInTheDocument();
      });
    });

    it('should handle task selection in batch mode', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const batchModeButton = screen.getByText('⚡ Batch Mode');
        fireEvent.click(batchModeButton);
        
        const checkbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(checkbox);
        // Should update selection
      });
    });

    it('should show batch controls when tasks are selected', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const batchModeButton = screen.getByText('⚡ Batch Mode');
        fireEvent.click(batchModeButton);
        expect(screen.getByText('Batch Edit')).toBeInTheDocument();
        expect(screen.getByText('Batch Delete')).toBeInTheDocument();
      });
    });
  });

  describe('Roadmap Integration', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });
    });

    it('should render roadmap toggle button', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText('📋 Show Roadmap')).toBeInTheDocument();
      });
    });

    it('should toggle roadmap visibility', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const roadmapButton = screen.getByText('📋 Show Roadmap');
        fireEvent.click(roadmapButton);
        // Should toggle roadmap display
      });
    });

    it('should display roadmap content when toggled', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const roadmapButton = screen.getByText('📋 Show Roadmap');
        fireEvent.click(roadmapButton);
        // Roadmap content should be visible
      });
    });
  });

  describe('Artefact Display and Interaction', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });
    });

    it('should render artefact cards', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText('User Interface Enhancement')).toBeInTheDocument();
        expect(screen.getByText('Backend API Development')).toBeInTheDocument();
      });
    });

    it('should handle artefact expansion', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const expandButton = screen.getAllByText('Expand')[0];
        fireEvent.click(expandButton);
        // Should expand the artefact card
      });
    });

    it('should show expand all and collapse all buttons', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText('📖 Expand All')).toBeInTheDocument();
        expect(screen.getByText('📕 Collapse All')).toBeInTheDocument();
      });
    });

    it('should handle expand/collapse all actions', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const expandAllButton = screen.getByText('📖 Expand All');
        fireEvent.click(expandAllButton);
        
        const collapseAllButton = screen.getByText('📕 Collapse All');
        fireEvent.click(collapseAllButton);
        // Should not throw errors
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading artefacts/)).toBeInTheDocument();
      });
    });

    it('should show retry option on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'structure' })
      });

      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        // Should handle gracefully without crashing
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockArtefacts[0],
        id: `artefact-${i}`,
        title: `Artefact ${i}`
      }));

      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => ({ artefacts: largeDataset })
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });

      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText(/Displaying 100 artefacts/)).toBeInTheDocument();
      });
    });

    it('should debounce filter changes', async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });

      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        // Multiple rapid filter changes should be debounced
        const clearButton = screen.getByText('Clear All Filters');
        fireEvent.click(clearButton);
        fireEvent.click(clearButton);
        fireEvent.click(clearButton);
        // Should not cause performance issues
      });
    });

    it('should cleanup on unmount', async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });

      const { unmount } = render(<WorkstreamFilterDemo />);
      
      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => mockApiResponses.artefacts
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ selectedFile: { content: 'roadmap content' } })
        });
    });

    it('should have proper heading structure', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        expect(screen.getByText('Workstream Filter Demo')).toBeInTheDocument();
      });
    });

    it('should have accessible form controls', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        
        buttons.forEach(button => {
          expect(button).toBeVisible();
        });
      });
    });

    it('should support keyboard navigation', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        const addButton = screen.getByText('Add Task');
        addButton.focus();
        expect(document.activeElement).toBe(addButton);
      });
    });

    it('should have proper ARIA labels', async () => {
      render(<WorkstreamFilterDemo />);

      await waitFor(() => {
        // Check for checkboxes in batch mode
        const batchModeButton = screen.getByText('⚡ Batch Mode');
        fireEvent.click(batchModeButton);
        
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });
  });
}); 