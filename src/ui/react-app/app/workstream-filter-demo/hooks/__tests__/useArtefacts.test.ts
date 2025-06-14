import { renderHook, waitFor } from '@testing-library/react';
import { useArtefacts } from '../useArtefacts';
import { artefactService } from '../../services/artefactService';

// Mock the workstream context
jest.mock('@/lib/workstream-context', () => ({
    useWorkstream: jest.fn(() => ({
        currentWorkstream: 'ora',
        isValidWorkstream: jest.fn((ws) => ws === 'ora' || ws === 'mecca'),
        loading: false,
        error: null
    }))
}));

// Mock the artefact service
jest.mock('../../services/artefactService', () => ({
    artefactService: {
        getArtefacts: jest.fn()
    }
}));

const mockArtefactService = artefactService as jest.Mocked<typeof artefactService>;

describe('useArtefacts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch artefacts on mount', async () => {
        const mockArtefacts = [
            {
                id: 'test-1',
                name: 'test-artefact-1',
                title: 'Test Artefact 1',
                phase: '11.1',
                workstream: 'ora',
                status: 'planning',
                score: 5,
                tags: ['test'],
                created: '2025-01-01',
                uuid: 'uuid-1',
                summary: 'Test summary',
                filePath: 'test.md',
                origin: 'test',
                type: 'task'
            }
        ];

        mockArtefactService.getArtefacts.mockResolvedValue(mockArtefacts);

        const { result } = renderHook(() => useArtefacts());

        // Initially loading
        expect(result.current.loading).toBe(true);
        expect(result.current.artefacts).toEqual([]);

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.artefacts).toEqual(mockArtefacts);
        expect(result.current.optimisticArtefacts).toEqual(mockArtefacts);
        expect(result.current.error).toBeNull();
        expect(mockArtefactService.getArtefacts).toHaveBeenCalledWith('ora');
    });

    it('should handle fetch errors', async () => {
        const errorMessage = 'Failed to fetch artefacts';
        mockArtefactService.getArtefacts.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useArtefacts());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.artefacts).toEqual([]);
    });

    it('should allow updating optimistic artefacts', async () => {
        const mockArtefacts = [
            {
                id: 'test-1',
                name: 'test-artefact-1',
                title: 'Test Artefact 1',
                phase: '11.1',
                workstream: 'ora',
                status: 'planning',
                score: 5,
                tags: ['test'],
                created: '2025-01-01',
                uuid: 'uuid-1',
                summary: 'Test summary',
                filePath: 'test.md',
                origin: 'test',
                type: 'task'
            }
        ];

        mockArtefactService.getArtefacts.mockResolvedValue(mockArtefacts);

        const { result } = renderHook(() => useArtefacts());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Update optimistic artefacts
        const updatedArtefacts = [
            ...mockArtefacts,
            {
                ...mockArtefacts[0],
                id: 'test-2',
                title: 'New Artefact'
            }
        ];

        result.current.updateOptimisticArtefacts(updatedArtefacts);

        expect(result.current.optimisticArtefacts).toEqual(updatedArtefacts);
        expect(result.current.artefacts).toEqual(mockArtefacts); // Original data unchanged
    });

    it('should provide refetch functionality', async () => {
        const mockArtefacts = [
            {
                id: 'test-1',
                name: 'test-artefact-1',
                title: 'Test Artefact 1',
                phase: '11.1',
                workstream: 'ora',
                status: 'planning',
                score: 5,
                tags: ['test'],
                created: '2025-01-01',
                uuid: 'uuid-1',
                summary: 'Test summary',
                filePath: 'test.md',
                origin: 'test',
                type: 'task'
            }
        ];

        mockArtefactService.getArtefacts.mockResolvedValue(mockArtefacts);

        const { result } = renderHook(() => useArtefacts());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Clear mock calls
        mockArtefactService.getArtefacts.mockClear();

        // Refetch data
        await result.current.refetchArtefacts();

        expect(mockArtefactService.getArtefacts).toHaveBeenCalledTimes(1);
    });
}); 