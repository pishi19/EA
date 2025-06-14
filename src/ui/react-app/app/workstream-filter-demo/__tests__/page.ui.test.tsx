import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkstreamFilterDemo from '../page';

// Mock external dependencies
jest.mock('@/lib/workstream-context', () => ({
  useWorkstream: jest.fn()
}));

jest.mock('../TreeNavigation', () => {
  return function MockTreeNavigation({ artefacts, onNodeSelect, workstream }: any) {
    return (
      <div data-testid="tree-navigation">
        <div data-testid="tree-workstream">{workstream}</div>
        <button onClick={() => onNodeSelect({ id: 'test-node', type: 'program' })}>
          Select Test Node
        </button>
        {artefacts?.map((artefact: any) => (
          <div key={artefact.id} data-testid={`tree-artefact-${artefact.id}`}>
            {artefact.title}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../ContextPane', () => {
  return function MockContextPane({ selectedNode, artefact }: any) {
    return (
      <div data-testid="context-pane">
        {selectedNode && <div data-testid="selected-node">{selectedNode.id}</div>}
        {artefact && <div data-testid="selected-artefact">{artefact.title}</div>}
      </div>
    );
  };
});

jest.mock('../useTreeState', () => {
  return jest.fn(() => ({
    selectedNode: null,
    expandedNodes: new Set(),
    syncWithFilters: jest.fn(),
    selectNode: jest.fn(),
    toggleExpansion: jest.fn()
  }));
});

jest.mock('../useRoadmapHierarchy', () => {
  return jest.fn(() => ({
    hierarchy: {
      workstreams: ['ora', 'mecca', 'sales'],
      programs: [
        {
          id: 'program-11',
          name: 'Artefact Hierarchy and Filtering',
          fullName: 'Phase 11: Artefact Hierarchy and Filtering',
          displayLabel: 'Phase 11: Artefact Hierarchy and Filtering',
          phase: '11',
          status: 'in_progress'
        }
      ],
      projects: [
        {
          id: 'project-11-1',
          name: 'Artefact Schema Canonicalization',
          fullName: 'Project 11.1: Artefact Schema Canonicalization',
          displayLabel: 'Project 11.1: Artefact Schema Canonicalization',
          phase: '11.1',
          status: 'complete',
          programId: 'program-11'
        }
      ],
      tasks: []
    },
    loading: false,
    error: null,
    getAvailableWorkstreams: () => ['ora', 'mecca', 'sales'],
    getAvailablePrograms: () => [
      { id: 'program-11', name: 'Artefact Hierarchy and Filtering', fullName: 'Phase 11: Artefact Hierarchy and Filtering', status: 'in_progress' }
    ],
    getAvailableProjects: () => [
      { id: 'project-11-1', name: 'Artefact Schema Canonicalization', fullName: 'Project 11.1: Artefact Schema Canonicalization', status: 'complete' }
    ],
    validateArtefactAlignment: jest.fn().mockReturnValue({
      isValid: true,
      validProgram: { id: 'program-11' },
      validProjects: [{ id: 'project-11-1' }]
    })
  }));
});

// Mock UI components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select data-testid="select" onChange={(e) => onValueChange(e.target.value)} value={value}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={`button ${className} ${variant}`} 
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span className={`badge ${className} ${variant}`} data-testid="badge">{children}</span>
  )
}));

// Mock additional components
jest.mock('@/components/UnifiedArtefactCard', () => {
  return function MockUnifiedArtefactCard({ artefact }: any) {
    return (
      <div data-testid="unified-artefact-card">
        <h3>{artefact.title}</h3>
        <p>Phase: {artefact.phase}</p>
        <span>Status: {artefact.status}</span>
        <div>{artefact.tags?.map((tag: string) => <span key={tag}>{tag}</span>)}</div>
      </div>
    );
  };
});

const mockUseWorkstream = require('@/lib/workstream-context').useWorkstream;

const mockArtefacts = [
  {
    id: 'artefact-1',
    name: 'artefact-1',
    title: 'Test Artefact 1',
    phase: '11.1',
    workstream: 'ora',
    status: 'complete',
    score: 5,
    tags: ['testing'],
    created: '2025-01-01',
    uuid: 'uuid-1',
    summary: 'Test summary 1',
    filePath: 'test1.md',
    origin: 'test',
    type: 'task'
  },
  {
    id: 'artefact-2',
    name: 'artefact-2',
    title: 'Test Artefact 2',
    phase: '11.2',
    workstream: 'ora',
    status: 'in_progress',
    score: 3,
    tags: ['development'],
    created: '2025-01-02',
    uuid: 'uuid-2',
    summary: 'Test summary 2',
    filePath: 'test2.md',
    origin: 'test',
    type: 'task'
  }
];

describe('WorkstreamFilterDemo Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock workstream context
    mockUseWorkstream.mockReturnValue({
      currentWorkstream: 'ora',
      isValidWorkstream: jest.fn().mockReturnValue(true),
      loading: false,
      error: null
    });

    // Setup mock fetch responses
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/demo-loops')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ artefacts: mockArtefacts })
        });
      }
      if (url.includes('/api/system-docs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            selectedFile: {
              content: '<h1>Test Roadmap</h1><p>Test content</p>'
            }
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Initial Rendering', () => {
    test('renders main page structure', async () => {
      render(<WorkstreamFilterDemo />);
      
      expect(screen.getByText(/Ora Workstream/)).toBeInTheDocument();
      expect(screen.getByTestId('tree-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('context-pane')).toBeInTheDocument();
    });

    test('loads and displays artefacts', async () => {
      render(<WorkstreamFilterDemo />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Artefact 1')).toBeInTheDocument();
        expect(screen.getByText('Test Artefact 2')).toBeInTheDocument();
      });
    });

    test('renders filter controls', async () => {
      render(<WorkstreamFilterDemo />);
      
      await waitFor(() => {
        expect(screen.getByText('Workstream')).toBeInTheDocument();
        expect(screen.getByText('Program')).toBeInTheDocument();
        expect(screen.getByText('Project')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    test('displays artefact counts', async () => {
      render(<WorkstreamFilterDemo />);
      
      await waitFor(() => {
        expect(screen.getByText(/2 artefacts/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    test('filters by workstream', async () => {
      render(<WorkstreamFilterDemo />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Artefact 1')).toBeInTheDocument();
      });

      // Change workstream filter
      const workstreamSelects = screen.getAllByTestId('select');
      const workstreamSelect = workstreamSelects[0]; // First select should be workstream
      fireEvent.change(workstreamSelect, { target: { value: 'mecca' } });
      
      // Should trigger API call with new workstream
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/demo-loops?workstream=mecca');
      });
    });

    test('clears all filters', async () => {
      render(<WorkstreamFilterDemo />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Artefact 1')).toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      fireEvent.click(clearButton);
      
      // Should show all artefacts
      await waitFor(() => {
        expect(screen.getByText('Test Artefact 1')).toBeInTheDocument();
        expect(screen.getByText('Test Artefact 2')).toBeInTheDocument();
      });
    });
  });

  describe('Tree Navigation Integration', () => {
    test('renders tree navigation component', async () => {
      render(<WorkstreamFilterDemo />);
      
      expect(screen.getByTestId('tree-navigation')).toBeInTheDocument();
    });

    test('handles tree node selection', async () => {
      render(<WorkstreamFilterDemo />);
      
      await waitFor(() => {
        expect(screen.getByTestId('tree-navigation')).toBeInTheDocument();
      });

      // Select a tree node
      const selectButton = screen.getByText('Select Test Node');
      fireEvent.click(selectButton);
      
      // Should update context pane
      await waitFor(() => {
        expect(screen.getByTestId('selected-node')).toHaveTextContent('test-node');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));
      
      render(<WorkstreamFilterDemo />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
}); 