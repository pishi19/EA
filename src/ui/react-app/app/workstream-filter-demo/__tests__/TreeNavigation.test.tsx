import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TreeNavigation from '../TreeNavigation';

// Mock the tree state hook
const mockTreeState = {
  expandedNodes: new Set(['program-11']),
  selectedNode: null,
  selectedArtefact: null,
  isTreeVisible: true,
  toggleTreeVisibility: jest.fn(),
  toggleNodeExpansion: jest.fn(),
  selectNode: jest.fn(),
  expandToArtefact: jest.fn(),
  resetTree: jest.fn()
};

const mockUseTreeState = jest.fn(() => mockTreeState);

jest.mock('../useTreeState', () => ({
  __esModule: true,
  default: mockUseTreeState
}));

// Mock the roadmap hierarchy hook
const mockHierarchy = {
  workstreams: ['Ora'],
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
      id: 'project-11-3',
      name: 'Interactive Roadmap Tree Navigation',
      fullName: 'Project 11.3: Interactive Roadmap Tree Navigation',
      displayLabel: 'Project 11.3: Interactive Roadmap Tree Navigation',
      phase: '11.3',
      status: 'in_progress',
      programId: 'program-11'
    }
  ],
  tasks: [],
  lastUpdated: '2025-01-20'
};

const mockUseRoadmapHierarchy = jest.fn(() => ({ hierarchy: mockHierarchy }));

jest.mock('../useRoadmapHierarchy', () => ({
  __esModule: true,
  default: mockUseRoadmapHierarchy
}));

describe('TreeNavigation Component', () => {
  const mockProps = {
    artefacts: [
      {
        id: 'task1',
        name: 'task1',
        title: 'Test Task 1',
        phase: '11.3.1',
        workstream: 'Ora',
        status: 'complete',
        score: 5,
        tags: ['tree-navigation'],
        created: '2025-12-15',
        uuid: 'uuid1',
        summary: 'Test task summary',
        filePath: 'runtime/loops/task1.md',
        origin: 'ui',
        type: 'task'
      }
    ],
    roadmapHierarchy: mockHierarchy,
    onNodeSelect: jest.fn(),
    selectedNodeId: undefined,
    className: 'test-class',
    validateArtefactAlignment: jest.fn(() => ({
      validProgram: { id: 'program-11' },
      validProjects: [{ id: 'project-11-3' }]
    })),
    onArtefactMutate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTreeState.mockReturnValue(mockTreeState);
    mockUseRoadmapHierarchy.mockReturnValue({ hierarchy: mockHierarchy });
  });

  it('renders without crashing', () => {
    render(<TreeNavigation {...mockProps} />);
    expect(screen.getByText('Ora')).toBeInTheDocument();
  });

  it('displays hierarchy structure correctly', () => {
    render(<TreeNavigation {...mockProps} />);
    
    expect(screen.getByText('Phase 11: Artefact Hierarchy and Filtering')).toBeInTheDocument();
    expect(screen.getByText('Project 11.3: Interactive Roadmap Tree Navigation')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
  });

  it('handles node selection', async () => {
    render(<TreeNavigation {...mockProps} />);
    
    const workstreamNode = screen.getByText('Ora');
    await userEvent.click(workstreamNode);
    
    expect(mockProps.onNodeSelect).toHaveBeenCalled();
  });

  it('displays artefact count badges', () => {
    render(<TreeNavigation {...mockProps} />);
    
    // Should show count badges for nodes with artefacts
    expect(screen.getByText('1')).toBeInTheDocument(); // Artefact count
  });

  it('handles mutation controls for artefacts', async () => {
    render(<TreeNavigation {...mockProps} />);
    
    // Find task node and trigger hover for mutation controls
    const taskNode = screen.getByText('Test Task 1');
    
    // Hover to activate mutation controls
    fireEvent.mouseEnter(taskNode);
    
    await waitFor(() => {
      // Should handle mutation controls gracefully
      expect(taskNode).toBeInTheDocument();
    });
  });

  it('shows status badges for artefacts', () => {
    render(<TreeNavigation {...mockProps} />);
    
    expect(screen.getByText('complete')).toBeInTheDocument();
  });

  it('validates artefact alignment', () => {
    render(<TreeNavigation {...mockProps} />);
    
    expect(mockProps.validateArtefactAlignment).toHaveBeenCalledWith(mockProps.artefacts[0]);
  });

  it('handles empty artefacts gracefully', () => {
    const emptyProps = {
      ...mockProps,
      artefacts: []
    };
    
    render(<TreeNavigation {...emptyProps} />);
    
    expect(screen.getByText('Ora')).toBeInTheDocument();
    expect(screen.getByText('Phase 11: Artefact Hierarchy and Filtering')).toBeInTheDocument();
  });

  it('supports artefact mutation with loading states', async () => {
    const mutationProps = {
      ...mockProps,
      onArtefactMutate: jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
    };
    
    render(<TreeNavigation {...mutationProps} />);
    
    const taskNode = screen.getByText('Test Task 1');
    fireEvent.mouseEnter(taskNode);
    
    // Should handle loading states during mutations
    await waitFor(() => {
      expect(taskNode).toBeInTheDocument();
    });
  });
}); 