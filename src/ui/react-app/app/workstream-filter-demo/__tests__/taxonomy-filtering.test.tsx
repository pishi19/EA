import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkstreamFilterDemo from '../page';

// Mock the roadmap hierarchy hook
jest.mock('../useRoadmapHierarchy', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    hierarchy: {
      programs: [
        {
          id: 'program-11',
          name: 'Phase 11 – Artefact Hierarchy and Filtering',
          fullName: 'Phase 11 – Artefact Hierarchy and Filtering',
          displayLabel: 'Phase 11: Artefact Hierarchy and Filtering',
          phase: '11',
          status: 'in_progress'
        }
      ],
      projects: [
        {
          id: 'project-11.2',
          name: 'Semantic Chat Demo Filtering',
          fullName: 'Project 11.2: Semantic Chat Demo Filtering',
          displayLabel: 'Project 11.2: Semantic Chat Demo Filtering',
          programId: 'program-11',
          status: 'complete'
        }
      ],
      tasks: [
        {
          id: 'task-11.2.1',
          name: 'Filtering Logic',
          fullName: 'Task 11.2.1: Filtering Logic',
          displayLabel: 'Task 11.2.1: Filtering Logic',
          projectId: 'project-11.2',
          status: 'complete'
        }
      ]
    },
    loading: false,
    error: null,
    getAvailableWorkstreams: () => ['all', 'Ora'],
    getAvailablePrograms: () => [
      { id: 'all', name: 'All Programs', fullName: 'All Programs', status: 'all' },
      {
        id: 'program-11',
        name: 'Phase 11 – Artefact Hierarchy and Filtering',
        fullName: 'Phase 11 – Artefact Hierarchy and Filtering',
        displayLabel: 'Phase 11: Artefact Hierarchy and Filtering',
        status: 'in_progress'
      }
    ],
    getAvailableProjects: () => [
      { id: 'all', name: 'All Projects', fullName: 'All Projects', status: 'all' },
      {
        id: 'project-11.2',
        name: 'Semantic Chat Demo Filtering',
        fullName: 'Project 11.2: Semantic Chat Demo Filtering',
        displayLabel: 'Project 11.2: Semantic Chat Demo Filtering',
        status: 'complete'
      }
    ],
    validateArtefactAlignment: () => ({
      isValid: true,
      validProgram: { id: 'program-11', name: 'Phase 11 – Artefact Hierarchy and Filtering' },
      validProjects: [{ id: 'project-11.2', name: 'Semantic Chat Demo Filtering' }],
      orphanTags: []
    })
  }))
}));

// Mock the tree state hook
jest.mock('../useTreeState', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    treeVisible: false,
    selectedNode: null,
    selectedArtefact: null,
    toggleTreeVisibility: jest.fn(),
    syncWithFilters: jest.fn()
  }))
}));

// Mock the fetch API
global.fetch = jest.fn();

const mockArtefacts = [
  {
    id: 'task1',
    name: 'task1',
    title: 'Test Task 1',
    phase: '11.2',
    workstream: 'Ora',
    status: 'in_progress',
    score: 5,
    tags: ['Inline Task Mutation'],
    created: '2025-12-15',
    uuid: 'uuid1',
    summary: 'Test task 1 summary',
    filePath: 'runtime/loops/task1.md',
    origin: 'ui',
    type: 'task'
  },
  {
    id: 'note1',
    name: 'note1',
    title: 'Test Note 1',
    phase: '11.1',
    workstream: 'Ora',
    status: 'complete',
    score: 3,
    tags: ['Artefact Schema'],
    created: '2025-12-14',
    uuid: 'uuid2',
    summary: 'Test note 1 summary',
    filePath: 'runtime/loops/note1.md',
    origin: 'ui',
    type: 'note'
  },
  {
    id: 'thought1',
    name: 'thought1',
    title: 'Test Thought 1',
    phase: '10.2',
    workstream: 'Ora',
    status: 'planning',
    score: 2,
    tags: ['API Integration'],
    created: '2025-12-13',
    uuid: 'uuid3',
    summary: 'Test thought 1 summary',
    filePath: 'runtime/loops/thought1.md',
    origin: 'ui',
    type: 'thought'
  }
];

const mockRoadmapResponse = {
  selectedFile: {
    content: '<h1>Test Roadmap</h1><p>Phase 11 test content</p>'
  }
};

beforeEach(() => {
  (fetch as jest.Mock).mockClear();
  (fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/demo-loops')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockArtefacts)
      });
    }
    if (url.includes('/api/system-docs')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRoadmapResponse)
      });
    }
    return Promise.reject(new Error('Unknown URL'));
  });
});

describe('Taxonomy Filtering', () => {
  it('renders the main page with correct title', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Roadmap-Driven Tree Navigation')).toBeInTheDocument();
    });
  });

  it('shows hierarchical filtering description', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Hierarchical Tree Navigation \+ Roadmap-Driven Filtering/)).toBeInTheDocument();
    });
  });

  it('shows all canonical taxonomy filters', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      // Use getAllByText for elements that appear multiple times
      expect(screen.getAllByText('Workstream')[0]).toBeInTheDocument();
      expect(screen.getByText('Program (Phase)')).toBeInTheDocument();
      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('Task')).toBeInTheDocument();
      expect(screen.getByText('Artefact Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('renders filter controls and headers', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('🏗️ Roadmap-Driven Hierarchical Filters')).toBeInTheDocument();
      expect(screen.getByText(/Hierarchical filtering based on roadmap.md structure/)).toBeInTheDocument();
    });
  });

  it('displays artefacts when loaded', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      // Use getAllByText for elements that appear multiple times
      expect(screen.getAllByText('Test Task 1')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Test Note 1')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Test Thought 1')[0]).toBeInTheDocument();
    });
  });

  it('shows clear all filters button', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
    });
  });

  it('displays roadmap section', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('📍 System Roadmap')).toBeInTheDocument();
      expect(screen.getByText(/Reference roadmap showing current phase progress/)).toBeInTheDocument();
    });
  });

  it('shows filtered task artefacts section', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/📋 Filtered Task Artefacts/)).toBeInTheDocument();
      expect(screen.getByText(/Showing artefacts matching current hierarchical filter selection/)).toBeInTheDocument();
    });
  });

  it('displays roadmap-driven hierarchy information', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('📊 Roadmap-Driven Hierarchy')).toBeInTheDocument();
      expect(screen.getByText('✅ Roadmap Structure')).toBeInTheDocument();
      expect(screen.getByText('🔧 Architecture Features')).toBeInTheDocument();
    });
  });

  it('shows alignment status section', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('🔍 Roadmap Alignment Status')).toBeInTheDocument();
      expect(screen.getByText('✅ Roadmap-Aligned Artefacts')).toBeInTheDocument();
      expect(screen.getByText('⚠️ Orphan Artefacts')).toBeInTheDocument();
    });
  });

  it('handles clear all filters click', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear All Filters');
    await userEvent.click(clearButton);

    // Should maintain clear filters button
    await waitFor(() => {
      expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
    });
  });

  it('displays tree navigation toggle button', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Hide Tree|Show Tree/)).toBeInTheDocument();
    });
  });

  it('shows batch mode toggle', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('⚡ Batch Mode')).toBeInTheDocument();
    });
  });

  it('displays summary statistics correctly', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Total:/)).toBeInTheDocument();
      expect(screen.getByText(/Filtered:/)).toBeInTheDocument();
      // Use getAllByText for elements that appear multiple times
      expect(screen.getAllByText(/artefacts/)[0]).toBeInTheDocument();
    });
  });

  it('shows roadmap hierarchy counts', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Programs:/)).toBeInTheDocument();
      expect(screen.getByText(/Projects:/)).toBeInTheDocument();
      expect(screen.getByText(/Tasks:/)).toBeInTheDocument();
      expect(screen.getByText(/Types:/)).toBeInTheDocument();
    });
  });

  it('displays architecture feature descriptions', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Roadmap.md parsing and hierarchy extraction/)).toBeInTheDocument();
      expect(screen.getByText(/Real-time orphan artefact detection/)).toBeInTheDocument();
      expect(screen.getByText(/Program\/project status tracking from roadmap/)).toBeInTheDocument();
    });
  });
}); 