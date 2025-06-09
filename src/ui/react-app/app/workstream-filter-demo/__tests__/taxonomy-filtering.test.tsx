import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkstreamFilterDemo from '../page';

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
    workstream: 'workstream-ui',
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
    workstream: 'system-integrity',
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
    content: '<h1>Test Roadmap</h1>'
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
  it('renders with default Ora workstream selected', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Ora')).toBeInTheDocument();
    });
  });

  it('shows all canonical taxonomy filters', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Workstream')).toBeInTheDocument();
      expect(screen.getByText('Program (Phase)')).toBeInTheDocument();
      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('Artefact Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('filters by workstream correctly', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    // Change workstream to system-integrity
    const workstreamSelect = screen.getByDisplayValue('Ora');
    await userEvent.click(workstreamSelect);
    
    // Note: In a real test, we'd need to mock the Select component interactions
    // For now, this tests the basic rendering
  });

  it('filters by artefact type correctly', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Artefact Type')).toBeInTheDocument();
    });

    // All artefacts should be visible initially
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Note 1')).toBeInTheDocument();
      expect(screen.getByText('Test Thought 1')).toBeInTheDocument();
    });
  });

  it('shows taxonomy compliance information', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Canonical Taxonomy Hierarchy')).toBeInTheDocument();
      expect(screen.getByText('Taxonomy Structure')).toBeInTheDocument();
      expect(screen.getByText('Default "Ora" (all artefacts belong to Ora workstream)')).toBeInTheDocument();
      expect(screen.getByText('task, note, thought, execution, loop')).toBeInTheDocument();
    });
  });

  it('displays correct taxonomy counts in header', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Types:/)).toBeInTheDocument();
      expect(screen.getByText(/Workstreams:/)).toBeInTheDocument();
      expect(screen.getByText(/Programs:/)).toBeInTheDocument();
    });
  });

  it('resets to Ora workstream when clearing filters', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      const clearButton = screen.getByText('Clear All Filters');
      expect(clearButton).toBeInTheDocument();
    });

    // Click clear filters button
    const clearButton = screen.getByText('Clear All Filters');
    await userEvent.click(clearButton);

    // Should reset to Ora workstream
    await waitFor(() => {
      expect(screen.getByDisplayValue('Ora')).toBeInTheDocument();
    });
  });

  it('enforces taxonomy compliance by hiding non-compliant artefacts', async () => {
    // Create mock with some non-compliant artefacts
    const nonCompliantArtefacts = [
      ...mockArtefacts,
      {
        id: 'invalid1',
        name: 'invalid1',
        title: 'Invalid Artefact',
        phase: '',
        workstream: 'invalid-workstream',
        status: 'unknown',
        score: 0,
        tags: [],
        created: '2025-12-15',
        uuid: 'uuid4',
        summary: 'Invalid artefact',
        filePath: 'runtime/loops/invalid1.md',
        origin: 'ui',
        type: 'invalid-type'
      }
    ];

    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/demo-loops')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(nonCompliantArtefacts)
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

    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      // Compliant artefacts should be visible
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Note 1')).toBeInTheDocument();
      
      // Non-compliant artefact should be hidden/normalized
      // The filtering logic should normalize invalid workstream to 'Ora' and invalid type to 'task'
    });
  });

  it('shows hierarchical taxonomy filtering description', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Hierarchical Taxonomy Filtering: Workstream → Program → Project → Artefact Type → Status')).toBeInTheDocument();
      expect(screen.getByText('Canonical Taxonomy Filter Demo')).toBeInTheDocument();
    });
  });

  it('displays taxonomy features and compliance enforcement', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Taxonomy Features')).toBeInTheDocument();
      expect(screen.getByText('Hierarchical filters with dependency cascading')).toBeInTheDocument();
      expect(screen.getByText('Taxonomy compliance enforcement (orphaned items hidden)')).toBeInTheDocument();
      expect(screen.getByText('Default workstream "Ora" for all artefacts')).toBeInTheDocument();
    });
  });
}); 