import { render, screen, fireEvent } from '@testing-library/react';
import TreeNavigation from '../TreeNavigation';

const mockArtefacts = [
    {
        id: '1',
        name: 'test-task-1',
        title: 'Test Task 1',
        phase: '11',
        workstream: 'Ora',
        program: 'Phase 11 – Artefact Hierarchy and Filtering',
        status: 'in_progress',
        score: 0,
        tags: ['Taxonomy Enforcement'],
        created: '2025-12-15',
        uuid: 'test-uuid-1',
        summary: 'Test summary 1',
        filePath: 'runtime/loops/test-1.md',
        origin: 'test',
        type: 'task'
    },
    {
        id: '2',
        name: 'test-task-2',
        title: 'Test Task 2',
        phase: '11',
        workstream: 'Ora',
        program: 'Phase 11 – Artefact Hierarchy and Filtering',
        status: 'complete',
        score: 0,
        tags: ['UI Component Architecture'],
        created: '2025-12-14',
        uuid: 'test-uuid-2',
        summary: 'Test summary 2',
        filePath: 'runtime/loops/test-2.md',
        origin: 'test',
        type: 'task'
    }
];

describe('TreeNavigation Component', () => {
    const mockOnNodeSelect = jest.fn();

    beforeEach(() => {
        mockOnNodeSelect.mockClear();
    });

    test('renders tree navigation with workstream nodes', () => {
        render(
            <TreeNavigation
                artefacts={mockArtefacts}
                onNodeSelect={mockOnNodeSelect}
                selectedNodeId={undefined}
            />
        );

        expect(screen.getByText('Roadmap Tree')).toBeInTheDocument();
        expect(screen.getByText('Ora')).toBeInTheDocument();
        expect(screen.getByText('2 artefacts')).toBeInTheDocument();
    });

    test('shows expand/collapse functionality', () => {
        render(
            <TreeNavigation
                artefacts={mockArtefacts}
                onNodeSelect={mockOnNodeSelect}
                selectedNodeId={undefined}
            />
        );

        // Find expand all button
        const expandButton = screen.getByText('Expand All');
        expect(expandButton).toBeInTheDocument();

        const collapseButton = screen.getByText('Collapse All');
        expect(collapseButton).toBeInTheDocument();
    });

    test('displays hierarchical structure', () => {
        render(
            <TreeNavigation
                artefacts={mockArtefacts}
                onNodeSelect={mockOnNodeSelect}
                selectedNodeId={undefined}
            />
        );

        // Should show workstream
        expect(screen.getByText('Ora')).toBeInTheDocument();
        
        // Should show program when expanded
        expect(screen.getByText('Phase 11 – Artefact Hierarchy and Filtering')).toBeInTheDocument();
    });

    test('calls onNodeSelect when clicking on nodes', () => {
        render(
            <TreeNavigation
                artefacts={mockArtefacts}
                onNodeSelect={mockOnNodeSelect}
                selectedNodeId={undefined}
            />
        );

        // Click on workstream node
        fireEvent.click(screen.getByText('Ora'));
        expect(mockOnNodeSelect).toHaveBeenCalled();
    });

    test('shows artefact counts', () => {
        render(
            <TreeNavigation
                artefacts={mockArtefacts}
                onNodeSelect={mockOnNodeSelect}
                selectedNodeId={undefined}
            />
        );

        // Should show count badge
        expect(screen.getByText('2')).toBeInTheDocument();
    });
}); 