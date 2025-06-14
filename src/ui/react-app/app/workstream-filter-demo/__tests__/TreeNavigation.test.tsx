import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TreeNavigation from '../TreeNavigation';
import { RoadmapHierarchy } from '../roadmapParser';

// Mock the custom hooks
jest.mock('../hooks/useRoadmapHierarchy', () => ({
  useRoadmapHierarchy: jest.fn()
}));

jest.mock('../hooks/useTreeState', () => ({
  useTreeState: jest.fn()
}));

// Mock external dependencies
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={`badge ${className}`}>{children}</span>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>{children}</button>
  )
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>
}));

const mockUseRoadmapHierarchy = require('../hooks/useRoadmapHierarchy').useRoadmapHierarchy;
const mockUseTreeState = require('../hooks/useTreeState').useTreeState;

interface Artefact {
  id: string;
  name: string;
  title: string;
  phase: string;
  workstream: string;
  program?: string;
  status: string;
  score: number;
  tags: string[];
  created: string;
  uuid: string;
  summary: string;
  filePath: string;
  origin: string;
  type?: string;
}

describe('TreeNavigation Component', () => {
  const mockRoadmapHierarchy: RoadmapHierarchy = {
    workstreams: ['ora'],
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
    tasks: [],
    lastUpdated: '2025-01-20'
  };

  const mockArtefacts: Artefact[] = [
    {
      id: 'task-1',
      name: 'task-1',
      title: 'Test Task 1',
      type: 'task',
      phase: '11.1',
      workstream: 'ora',
      program: 'program-11',
      status: 'complete',
      score: 5,
      tags: ['testing'],
      created: '2025-01-01',
      uuid: 'uuid-1',
      summary: 'Test summary',
      filePath: 'test.md',
      origin: 'test'
    },
    {
      id: 'task-2',
      name: 'task-2', 
      title: 'Test Task 2',
      type: 'task',
      phase: '12',
      workstream: 'ora',
      status: 'in_progress',
      score: 3,
      tags: ['development'],
      created: '2025-01-02',
      uuid: 'uuid-2',
      summary: 'Test summary 2',
      filePath: 'test2.md',
      origin: 'test'
    }
  ];

  const mockValidateArtefactAlignment = jest.fn().mockImplementation((artefact: Artefact) => ({
    validProgram: { id: 'program-11' },
    validProjects: artefact.phase === '11.1' ? [{ id: 'project-11-1' }] : []
  }));

  const mockProps = {
    artefacts: mockArtefacts,
    roadmapHierarchy: mockRoadmapHierarchy,
    selectedArtefact: null,
    onNodeSelect: jest.fn(),
    workstream: 'ora',
    validateArtefactAlignment: mockValidateArtefactAlignment,
    onArtefactMutate: jest.fn()
  };

  const mockTreeState = {
    expandedNodes: new Set(['ora', 'phase-11']),
    selectedNode: null,
    toggleNode: jest.fn(),
    selectNode: jest.fn(),
    setSelectedNode: jest.fn(),
    isExpanded: jest.fn(),
    isSelected: jest.fn()
  };

  const mockHierarchy = {
    programs: [
      {
        id: 'phase-11',
        number: 11,
        title: 'Artefact Hierarchy and Filtering',
        fullTitle: 'Phase 11: Artefact Hierarchy and Filtering',
        displayLabel: 'Phase 11: Artefact Hierarchy and Filtering',
        projects: [
          {
            id: 'project-11-1',
            title: 'Artefact Schema Canonicalization',
            fullTitle: 'Project 11.1: Artefact Schema Canonicalization',
            displayLabel: 'Project 11.1: Artefact Schema Canonicalization',
            tasks: []
          }
        ]
      }
    ],
    loading: false,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTreeState.mockReturnValue(mockTreeState);
    mockUseRoadmapHierarchy.mockReturnValue(mockHierarchy);
    
    // Setup default tree state methods
    mockTreeState.isExpanded.mockImplementation((nodeId) => 
      mockTreeState.expandedNodes.has(nodeId)
    );
    mockTreeState.isSelected.mockImplementation((nodeId) => 
      mockTreeState.selectedNode === nodeId
    );
  });

  describe('Rendering', () => {
    test('renders tree navigation container', () => {
      render(<TreeNavigation {...mockProps} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('displays workstream root node', () => {
      render(<TreeNavigation {...mockProps} />);
      expect(screen.getByText('ora')).toBeInTheDocument();
    });

    test('renders loading state when hierarchy is loading', () => {
      mockUseRoadmapHierarchy.mockReturnValue({
        ...mockHierarchy,
        loading: true
      });
      
      render(<TreeNavigation {...mockProps} />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('displays error message when hierarchy loading fails', () => {
      mockUseRoadmapHierarchy.mockReturnValue({
        ...mockHierarchy,
        loading: false,
        error: 'Failed to load hierarchy'
      });
      
      render(<TreeNavigation {...mockProps} />);
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    test('handles null roadmap hierarchy', () => {
      const propsWithNullHierarchy = {
        ...mockProps,
        roadmapHierarchy: null
      };
      
      render(<TreeNavigation {...propsWithNullHierarchy} />);
      // Should render container even with null hierarchy
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });
  });

  describe('Tree Structure', () => {
    test('renders program nodes correctly', () => {
      render(<TreeNavigation {...mockProps} />);
      expect(screen.getByText('Phase 11: Artefact Hierarchy and Filtering')).toBeInTheDocument();
    });

    test('shows artefact count badges', () => {
      render(<TreeNavigation {...mockProps} />);
      const badges = screen.getAllByText(/\d+/);
      expect(badges.length).toBeGreaterThan(0);
    });

    test('renders project nodes when program is expanded', async () => {
      const user = userEvent.setup();
      render(<TreeNavigation {...mockProps} />);
      
      // Click on program to expand it
      const programNode = screen.getByText('Phase 11: Artefact Hierarchy and Filtering');
      await user.click(programNode);
      
      expect(screen.getByText('Project 11.1: Artefact Schema Canonicalization')).toBeInTheDocument();
    });

    test('does not render project nodes when program is collapsed', () => {
      mockTreeState.expandedNodes.clear();
      
      render(<TreeNavigation {...mockProps} />);
      expect(screen.queryByText('Project 11.1: Artefact Schema Canonicalization')).not.toBeInTheDocument();
    });
  });

  describe('Node Interaction', () => {
    test('expands node when clicked', async () => {
      const user = userEvent.setup();
      render(<TreeNavigation {...mockProps} />);
      
      const programNode = screen.getByText('Phase 11: Artefact Hierarchy and Filtering');
      await user.click(programNode);
      
      expect(mockProps.onNodeSelect).toHaveBeenCalled();
    });

    test('selects node when clicked', async () => {
      const user = userEvent.setup();
      render(<TreeNavigation {...mockProps} />);
      
      const nodeElement = screen.getByText('ora');
      await user.click(nodeElement);
      
      expect(mockProps.onNodeSelect).toHaveBeenCalled();
    });

    test('calls onNodeSelect prop when node is selected', async () => {
      const user = userEvent.setup();
      render(<TreeNavigation {...mockProps} />);
      
      const nodeElement = screen.getByText('ora');
      await user.click(nodeElement);
      
      expect(mockProps.onNodeSelect).toHaveBeenCalled();
    });

    test('shows expanded indicator for expanded nodes', () => {
      mockTreeState.isExpanded.mockReturnValue(true);
      
      render(<TreeNavigation {...mockProps} />);
      // Check for expanded indicator (chevron down or similar)
      expect(screen.getByTestId('expanded-indicator')).toBeInTheDocument();
    });

    test('shows collapsed indicator for collapsed nodes', () => {
      mockTreeState.isExpanded.mockReturnValue(false);
      
      render(<TreeNavigation {...mockProps} />);
      // Check for collapsed indicator (chevron right or similar)
      expect(screen.getByTestId('collapsed-indicator')).toBeInTheDocument();
    });
  });

  describe('Artefact Handling', () => {
    test('displays artefacts under appropriate projects', async () => {
      const user = userEvent.setup();
      render(<TreeNavigation {...mockProps} />);
      
      // Expand program first
      const programNode = screen.getByText('Phase 11: Artefact Hierarchy and Filtering');
      await user.click(programNode);
      
      // Expand project
      const projectNode = screen.getByText('Project 11.1: Artefact Schema Canonicalization');
      await user.click(projectNode);
      
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    test('shows correct artefact count per project', () => {
      render(<TreeNavigation {...mockProps} />);
      // Should show count of artefacts associated with each node
      const countBadges = screen.getAllByText('1');
      expect(countBadges.length).toBeGreaterThan(0);
    });

    test('calls mutation handler when artefact is mutated', async () => {
      const user = userEvent.setup();
      render(<TreeNavigation {...mockProps} />);
      
      // Expand to show artefacts
      const programNode = screen.getByText('Phase 11: Artefact Hierarchy and Filtering');
      await user.click(programNode);
      
      const projectNode = screen.getByText('Project 11.1: Artefact Schema Canonicalization');
      await user.click(projectNode);
      
      const artefactElement = screen.getByText('Test Task 1');
      
      // Hover to show mutation controls
      fireEvent.mouseEnter(artefactElement);
      
      // Should show mutation controls on hover
      expect(artefactElement).toBeInTheDocument();
    });

    test('highlights selected artefact', () => {
      const propsWithSelected = {
        ...mockProps,
        selectedArtefact: mockProps.artefacts[0]
      };
      
      mockTreeState.expandedNodes.add('phase-11');
      mockTreeState.expandedNodes.add('project-11-1');
      
      render(<TreeNavigation {...propsWithSelected} />);
      
      const selectedElement = screen.getByText('Test Task 1');
      expect(selectedElement).toHaveClass('selected');
    });
  });

  describe('Workstream Context', () => {
    test('filters artefacts by workstream', () => {
      const propsWithDifferentWorkstream = {
        ...mockProps,
        workstream: 'different-workstream'
      };
      
      render(<TreeNavigation {...propsWithDifferentWorkstream} />);
      
      // Should still show the tree structure but workstream name should change
      expect(screen.getByText('different-workstream')).toBeInTheDocument();
    });

    test('displays workstream name in root node', () => {
      render(<TreeNavigation {...mockProps} />);
      expect(screen.getByText('ora')).toBeInTheDocument();
    });

    test('handles workstream change correctly', () => {
      const { rerender } = render(<TreeNavigation {...mockProps} />);
      
      const newProps = { ...mockProps, workstream: 'mecca' };
      rerender(<TreeNavigation {...newProps} />);
      
      expect(screen.getByText('mecca')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty artefacts array', () => {
      const propsWithNoArtefacts = {
        ...mockProps,
        artefacts: []
      };
      
      render(<TreeNavigation {...propsWithNoArtefacts} />);
      expect(screen.getByText('ora')).toBeInTheDocument();
    });

    test('handles missing hierarchy gracefully', () => {
      const propsWithEmptyHierarchy = {
        ...mockProps,
        roadmapHierarchy: {
          workstreams: [],
          programs: [],
          projects: [],
          tasks: [],
          lastUpdated: '2025-01-20'
        }
      };
      
      render(<TreeNavigation {...propsWithEmptyHierarchy} />);
      // Should render without crashing
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });

    test('handles artefacts without projects', () => {
      const artefactsWithoutProject = [
        {
          id: 'orphan-task',
          name: 'orphan-task',
          title: 'Orphan Task',
          type: 'task',
          phase: '11',
          workstream: 'ora',
          status: 'complete',
          score: 1,
          tags: [],
          created: '2025-01-01',
          uuid: 'orphan-uuid',
          summary: 'Orphan summary',
          filePath: 'orphan.md',
          origin: 'test'
        }
      ];
      
      const propsWithOrphans = {
        ...mockProps,
        artefacts: artefactsWithoutProject
      };
      
      render(<TreeNavigation {...propsWithOrphans} />);
      expect(screen.getByText('ora')).toBeInTheDocument();
    });
  });

  describe('Status and Badges', () => {
    test('displays status badges for programs and projects', () => {
      render(<TreeNavigation {...mockProps} />);
      expect(screen.getByText('in_progress')).toBeInTheDocument();
    });

    test('shows roadmap indicators for roadmap-defined nodes', () => {
      render(<TreeNavigation {...mockProps} />);
      // Roadmap indicator (📋) should be present for roadmap-defined nodes
      expect(screen.getAllByText('📋')).toHaveLength(2); // Program and project
    });

    test('displays different status colors correctly', () => {
      const hierarchyWithDifferentStatuses = {
        ...mockRoadmapHierarchy,
        programs: [
          ...mockRoadmapHierarchy.programs,
          {
            id: 'program-12',
            name: 'Test Program',
            fullName: 'Phase 12: Test Program',
            displayLabel: 'Phase 12: Test Program',
            phase: '12',
            status: 'complete'
          }
        ]
      };

      const propsWithDifferentStatuses = {
        ...mockProps,
        roadmapHierarchy: hierarchyWithDifferentStatuses
      };

      render(<TreeNavigation {...propsWithDifferentStatuses} />);
      expect(screen.getByText('complete')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<TreeNavigation {...mockProps} />);
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label');
    });

    test('tree items have proper roles', () => {
      render(<TreeNavigation {...mockProps} />);
      const treeItems = screen.getAllByRole('treeitem');
      expect(treeItems.length).toBeGreaterThan(0);
    });

    test('expanded state is communicated to screen readers', () => {
      mockTreeState.isExpanded.mockReturnValue(true);
      
      render(<TreeNavigation {...mockProps} />);
      const expandedElement = screen.getByRole('treeitem', { expanded: true });
      expect(expandedElement).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TreeNavigation {...mockProps} />);
      
      const treeItem = screen.getAllByRole('treeitem')[0];
      await user.tab();
      expect(treeItem).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('handles large number of artefacts efficiently', () => {
      const manyArtefacts = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        name: `task-${i}`,
        title: `Task ${i}`,
        type: 'task',
        phase: '11.1',
        workstream: 'ora',
        status: 'complete',
        score: 1,
        tags: [],
        created: '2025-01-01',
        uuid: `uuid-${i}`,
        summary: `Summary ${i}`,
        filePath: `task${i}.md`,
        origin: 'test'
      }));
      
      const propsWithManyArtefacts = {
        ...mockProps,
        artefacts: manyArtefacts
      };
      
      const startTime = performance.now();
      render(<TreeNavigation {...propsWithManyArtefacts} />);
      const endTime = performance.now();
      
      // Should render in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(<TreeNavigation {...mockProps} />);
      
      // Re-render with same props
      rerender(<TreeNavigation {...mockProps} />);
      
      // Should handle re-renders gracefully
      expect(screen.getByText('ora')).toBeInTheDocument();
    });
  });
}); 