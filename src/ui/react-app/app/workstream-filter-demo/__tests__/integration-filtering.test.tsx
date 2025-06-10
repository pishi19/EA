import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkstreamFilterDemo from '../page';

// Mock the hooks and APIs
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock data
const mockRoadmapHierarchy = {
  workstreams: ['Ora'],
  programs: [
    {
      id: 'program-11',
      name: 'Phase 11 – Artefact Hierarchy and Filtering',
      fullName: 'Phase 11 – Artefact Hierarchy and Filtering',
      displayLabel: 'Phase 11: Artefact Hierarchy and Filtering',
      phase: '11',
      status: 'in_progress',
      projects: []
    },
    {
      id: 'program-12',
      name: 'Phase 12 – Administration & Governance',
      fullName: 'Phase 12 – Administration & Governance',
      displayLabel: 'Phase 12: Administration & Governance',
      phase: '12',
      status: 'planning',
      projects: []
    }
  ],
  projects: [
    {
      id: 'project-11-3',
      name: 'Interactive Roadmap Tree Navigation',
      fullName: 'Project 11.3: Interactive Roadmap Tree Navigation',
      displayLabel: 'Project 11.3: Interactive Roadmap Tree Navigation',
      phase: '11.3',
      status: 'in_progress',
      programId: 'program-11'
    },
    {
      id: 'project-12-1',
      name: 'Admin UI Development',
      fullName: 'Project 12.1: Admin UI Development',
      displayLabel: 'Project 12.1: Admin UI Development',
      phase: '12.1',
      status: 'planning',
      programId: 'program-12'
    }
  ],
  tasks: [],
  lastUpdated: '2025-01-20'
};

const mockArtefacts = [
  {
    id: 'task1',
    name: 'task1',
    title: 'Tree Navigation Implementation',
    phase: '11.3',
    workstream: 'Ora',
    status: 'in_progress',
    score: 5,
    tags: ['UI', 'Navigation'],
    created: '2025-12-15',
    uuid: 'uuid1',
    summary: 'Implement tree navigation for roadmap',
    filePath: 'runtime/loops/task1.md',
    origin: 'ui',
    type: 'task'
  },
  {
    id: 'task2',
    name: 'task2',
    title: 'Admin Dashboard Design',
    phase: '12.1',
    workstream: 'Ora',
    status: 'planning',
    score: 3,
    tags: ['Admin', 'UI'],
    created: '2025-12-10',
    uuid: 'uuid2',
    summary: 'Design admin dashboard interface',
    filePath: 'runtime/loops/task2.md',
    origin: 'ui',
    type: 'task'
  },
  {
    id: 'note1',
    name: 'note1',
    title: 'Architecture Notes',
    phase: '11.2',
    workstream: 'Ora',
    status: 'complete',
    score: 4,
    tags: ['Architecture'],
    created: '2025-12-05',
    uuid: 'uuid3',
    summary: 'Notes on system architecture',
    filePath: 'runtime/loops/note1.md',
    origin: 'ui',
    type: 'note'
  }
];

// Mock API responses
beforeEach(() => {
  jest.clearAllMocks();
  
  mockFetch.mockImplementation((url) => {
    if (url === '/api/roadmap') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRoadmapHierarchy)
      } as Response);
    }
    
    if (url === '/api/demo-loops') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockArtefacts)
      } as Response);
    }
    
    if (url === '/api/memory-trace') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ entries: [] })
      } as Response);
    }
    
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    } as Response);
  });
});

describe('Integration: Filtering System', () => {
  it('loads initial data and displays artefacts', async () => {
    render(<WorkstreamFilterDemo />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
      expect(screen.getByText('Admin Dashboard Design')).toBeInTheDocument();
      expect(screen.getByText('Architecture Notes')).toBeInTheDocument();
    });
    
    // Should show total count
    expect(screen.getByText('3 artefacts')).toBeInTheDocument();
  });

  it('filters by workstream correctly', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
    });
    
    // All artefacts are in 'Ora' workstream by default
    expect(screen.getByText('3 artefacts')).toBeInTheDocument();
  });

  it('filters by program (phase) correctly', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
    });
    
    // Find and click program filter dropdown
    const programFilter = screen.getByDisplayValue('All Programs');
    await userEvent.click(programFilter);
    
    // Select Phase 11
    await waitFor(() => {
      const phase11Option = screen.getByText('Phase 11: Artefact Hierarchy and Filtering');
      expect(phase11Option).toBeInTheDocument();
    });
    
    const phase11Option = screen.getByText('Phase 11: Artefact Hierarchy and Filtering');
    await userEvent.click(phase11Option);
    
    // Should filter to only Phase 11 artefacts
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
      expect(screen.getByText('Architecture Notes')).toBeInTheDocument();
      expect(screen.queryByText('Admin Dashboard Design')).not.toBeInTheDocument();
    });
  });

  it('filters by project correctly', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
    });
    
    // Find and click project filter dropdown
    const projectFilter = screen.getByDisplayValue('All Projects');
    await userEvent.click(projectFilter);
    
    // Select Project 11.3
    await waitFor(() => {
      const project11_3 = screen.getByText('Project 11.3: Interactive Roadmap Tree Navigation');
      expect(project11_3).toBeInTheDocument();
    });
    
    const project11_3 = screen.getByText('Project 11.3: Interactive Roadmap Tree Navigation');
    await userEvent.click(project11_3);
    
    // Should filter to only Project 11.3 artefacts
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
      expect(screen.queryByText('Admin Dashboard Design')).not.toBeInTheDocument();
      expect(screen.queryByText('Architecture Notes')).not.toBeInTheDocument();
    });
  });

  it('filters by artefact type correctly', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
    });
    
    // Find and click artefact type filter dropdown
    const typeFilter = screen.getByDisplayValue('All Types');
    await userEvent.click(typeFilter);
    
    // Select 'task' type
    const taskOption = screen.getByText('task');
    await userEvent.click(taskOption);
    
    // Should filter to only task artefacts
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
      expect(screen.getByText('Admin Dashboard Design')).toBeInTheDocument();
      expect(screen.queryByText('Architecture Notes')).not.toBeInTheDocument();
    });
  });

  it('filters by status correctly', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
    });
    
    // Find and click status filter dropdown
    const statusFilter = screen.getByDisplayValue('All Statuses');
    await userEvent.click(statusFilter);
    
    // Select 'in_progress' status
    const inProgressOption = screen.getByText('in_progress');
    await userEvent.click(inProgressOption);
    
    // Should filter to only in_progress artefacts
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
      expect(screen.queryByText('Admin Dashboard Design')).not.toBeInTheDocument();
      expect(screen.queryByText('Architecture Notes')).not.toBeInTheDocument();
    });
  });

  it('combines multiple filters correctly', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
    });
    
    // Apply program filter (Phase 11)
    const programFilter = screen.getByDisplayValue('All Programs');
    await userEvent.click(programFilter);
    
    await waitFor(() => {
      const phase11Option = screen.getByText('Phase 11: Artefact Hierarchy and Filtering');
      await userEvent.click(phase11Option);
    });
    
    // Apply status filter (in_progress)
    const statusFilter = screen.getByDisplayValue('All Statuses');
    await userEvent.click(statusFilter);
    
    const inProgressOption = screen.getByText('in_progress');
    await userEvent.click(inProgressOption);
    
    // Should show only artefacts matching both filters
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
      expect(screen.queryByText('Admin Dashboard Design')).not.toBeInTheDocument();
      expect(screen.queryByText('Architecture Notes')).not.toBeInTheDocument();
    });
  });

  it('resets filters correctly', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
    });
    
    // Apply a filter first
    const statusFilter = screen.getByDisplayValue('All Statuses');
    await userEvent.click(statusFilter);
    
    const inProgressOption = screen.getByText('in_progress');
    await userEvent.click(inProgressOption);
    
    // Verify filter is applied
    await waitFor(() => {
      expect(screen.queryByText('Architecture Notes')).not.toBeInTheDocument();
    });
    
    // Reset filters
    const clearButton = screen.getByText('Clear All Filters');
    await userEvent.click(clearButton);
    
    // Should show all artefacts again
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
      expect(screen.getByText('Admin Dashboard Design')).toBeInTheDocument();
      expect(screen.getByText('Architecture Notes')).toBeInTheDocument();
    });
  });

  it('updates filter counts dynamically', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('3 artefacts')).toBeInTheDocument();
    });
    
    // Apply status filter
    const statusFilter = screen.getByDisplayValue('All Statuses');
    await userEvent.click(statusFilter);
    
    const inProgressOption = screen.getByText('in_progress');
    await userEvent.click(inProgressOption);
    
    // Count should update
    await waitFor(() => {
      expect(screen.getByText('1 artefact')).toBeInTheDocument();
    });
  });

  it('handles empty filter results', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
    });
    
    // Apply filters that would result in no matches
    const statusFilter = screen.getByDisplayValue('All Statuses');
    await userEvent.click(statusFilter);
    
    const blockedOption = screen.getByText('blocked');
    await userEvent.click(blockedOption);
    
    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText('0 artefacts')).toBeInTheDocument();
      expect(screen.queryByText('Tree Navigation Implementation')).not.toBeInTheDocument();
    });
  });

  it('maintains filter state during tree navigation', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
    });
    
    // Apply a filter
    const statusFilter = screen.getByDisplayValue('All Statuses');
    await userEvent.click(statusFilter);
    
    const inProgressOption = screen.getByText('in_progress');
    await userEvent.click(inProgressOption);
    
    // Interact with tree navigation
    const treeNode = screen.getByText('Ora');
    await userEvent.click(treeNode);
    
    // Filter should still be applied
    await waitFor(() => {
      expect(screen.getByText('1 artefact')).toBeInTheDocument();
    });
  });

  it('synchronizes tree and filter state', async () => {
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('Tree Navigation Implementation')).toBeInTheDocument();
    });
    
    // Click on a program in the tree
    const programNode = screen.getByText('Phase 11: Artefact Hierarchy and Filtering');
    await userEvent.click(programNode);
    
    // Filter should update to reflect tree selection
    await waitFor(() => {
      expect(screen.getByDisplayValue('Phase 11: Artefact Hierarchy and Filtering')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API failure
    mockFetch.mockImplementation(() => 
      Promise.reject(new Error('API Error'))
    );
    
    render(<WorkstreamFilterDemo />);
    
    // Should handle error gracefully
    await waitFor(() => {
      // Check for error state or fallback content
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('performs well with large datasets', async () => {
    // Create large mock dataset
    const largeArtefactSet = Array(100).fill(null).map((_, index) => ({
      id: `task${index}`,
      name: `task${index}`,
      title: `Test Task ${index}`,
      phase: index % 2 === 0 ? '11.3' : '12.1',
      workstream: 'Ora',
      status: ['in_progress', 'planning', 'complete'][index % 3],
      score: Math.floor(Math.random() * 10),
      tags: [`tag${index % 5}`],
      created: '2025-12-15',
      uuid: `uuid${index}`,
      summary: `Test task ${index} summary`,
      filePath: `runtime/loops/task${index}.md`,
      origin: 'ui',
      type: 'task'
    }));
    
    mockFetch.mockImplementation((url) => {
      if (url === '/api/demo-loops') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(largeArtefactSet)
        } as Response);
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRoadmapHierarchy)
      } as Response);
    });
    
    const startTime = performance.now();
    render(<WorkstreamFilterDemo />);
    
    await waitFor(() => {
      expect(screen.getByText('100 artefacts')).toBeInTheDocument();
    });
    
    const loadTime = performance.now() - startTime;
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(5000); // 5 seconds
    
    // Test filtering performance
    const filterStartTime = performance.now();
    
    const statusFilter = screen.getByDisplayValue('All Statuses');
    await userEvent.click(statusFilter);
    
    const inProgressOption = screen.getByText('in_progress');
    await userEvent.click(inProgressOption);
    
    await waitFor(() => {
      expect(screen.getByText(/\d+ artefacts?/)).toBeInTheDocument();
    });
    
    const filterTime = performance.now() - filterStartTime;
    
    // Filtering should be fast
    expect(filterTime).toBeLessThan(1000); // 1 second
  });
}); 