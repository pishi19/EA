import { renderHook, waitFor } from '@testing-library/react';
import useRoadmapHierarchy from '../useRoadmapHierarchy';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('useRoadmapHierarchy Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads roadmap hierarchy successfully', async () => {
    const mockRoadmapData = {
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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoadmapData)
    } as Response);

    const { result } = renderHook(() => useRoadmapHierarchy());

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hierarchy).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hierarchy).toEqual(mockRoadmapData);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/roadmap');
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useRoadmapHierarchy());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for error state
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hierarchy).toBeNull();
    expect(result.current.error).toContain('API Error');
  });

  it('handles malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON'))
    } as Response);

    const { result } = renderHook(() => useRoadmapHierarchy());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hierarchy).toBeNull();
    expect(result.current.error).toContain('Invalid JSON');
  });

  it('handles HTTP error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    } as Response);

    const { result } = renderHook(() => useRoadmapHierarchy());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hierarchy).toBeNull();
    expect(result.current.error).toContain('500');
  });

  it('caches requests to avoid duplicate API calls', async () => {
    const mockRoadmapData = {
      workstreams: ['Ora'],
      programs: [],
      projects: [],
      tasks: [],
      lastUpdated: '2025-01-20'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRoadmapData)
    } as Response);

    // Render multiple instances of the hook
    const { result: result1 } = renderHook(() => useRoadmapHierarchy());
    const { result: result2 } = renderHook(() => useRoadmapHierarchy());

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
      expect(result2.current.isLoading).toBe(false);
    });

    // Should only make one API call due to caching/deduplication
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result1.current.hierarchy).toEqual(mockRoadmapData);
    expect(result2.current.hierarchy).toEqual(mockRoadmapData);
  });

  it('provides complete hierarchy structure', async () => {
    const mockRoadmapData = {
      workstreams: ['Ora', 'External'],
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
        }
      ],
      tasks: [
        {
          id: 'task-11-3-1',
          name: 'Tree Component/Sidebar',
          fullName: 'Task 11.3.1: Tree Component/Sidebar',
          displayLabel: 'Task 11.3.1: Tree Component/Sidebar',
          phase: '11.3.1',
          status: 'complete',
          projectId: 'project-11-3'
        }
      ],
      lastUpdated: '2025-01-20'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoadmapData)
    } as Response);

    const { result } = renderHook(() => useRoadmapHierarchy());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hierarchy).toEqual(mockRoadmapData);
    expect(result.current.hierarchy?.workstreams).toHaveLength(2);
    expect(result.current.hierarchy?.programs).toHaveLength(2);
    expect(result.current.hierarchy?.projects).toHaveLength(1);
    expect(result.current.hierarchy?.tasks).toHaveLength(1);
  });

  it('handles empty roadmap data', async () => {
    const emptyRoadmapData = {
      workstreams: [],
      programs: [],
      projects: [],
      tasks: [],
      lastUpdated: '2025-01-20'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(emptyRoadmapData)
    } as Response);

    const { result } = renderHook(() => useRoadmapHierarchy());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hierarchy).toEqual(emptyRoadmapData);
    expect(result.current.error).toBeNull();
  });

  it('retries on network failure', async () => {
    // First call fails
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Second call succeeds
    const mockRoadmapData = {
      workstreams: ['Ora'],
      programs: [],
      projects: [],
      tasks: [],
      lastUpdated: '2025-01-20'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoadmapData)
    } as Response);

    const { result, rerender } = renderHook(() => useRoadmapHierarchy());

    // Initial failure
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    // Rerender to trigger retry
    rerender();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hierarchy).toEqual(mockRoadmapData);
      expect(result.current.error).toBeNull();
    });
  });

  it('handles missing required fields gracefully', async () => {
    const incompleteRoadmapData = {
      workstreams: ['Ora'],
      programs: [
        {
          id: 'program-11',
          name: 'Phase 11',
          // Missing other required fields
        }
      ],
      // Missing other required arrays
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(incompleteRoadmapData)
    } as Response);

    const { result } = renderHook(() => useRoadmapHierarchy());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should handle incomplete data gracefully
    expect(result.current.hierarchy).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('provides proper TypeScript typing', async () => {
    const mockRoadmapData = {
      workstreams: ['Ora'],
      programs: [],
      projects: [],
      tasks: [],
      lastUpdated: '2025-01-20'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoadmapData)
    } as Response);

    const { result } = renderHook(() => useRoadmapHierarchy());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // TypeScript should properly infer types
    expect(result.current.hierarchy?.workstreams).toEqual(['Ora']);
    expect(Array.isArray(result.current.hierarchy?.programs)).toBe(true);
    expect(Array.isArray(result.current.hierarchy?.projects)).toBe(true);
    expect(Array.isArray(result.current.hierarchy?.tasks)).toBe(true);
    expect(typeof result.current.hierarchy?.lastUpdated).toBe('string');
  });

  it('handles concurrent hook instances', async () => {
    const mockRoadmapData = {
      workstreams: ['Ora'],
      programs: [],
      projects: [],
      tasks: [],
      lastUpdated: '2025-01-20'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRoadmapData)
    } as Response);

    // Render multiple hooks simultaneously
    const hooks = Array(5).fill(null).map(() => renderHook(() => useRoadmapHierarchy()));

    await Promise.all(hooks.map(({ result }) => 
      waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      })
    ));

    // All hooks should have the same data
    hooks.forEach(({ result }) => {
      expect(result.current.hierarchy).toEqual(mockRoadmapData);
      expect(result.current.error).toBeNull();
    });

    // Should efficiently handle concurrent requests
    expect(mockFetch).toHaveBeenCalledWith('/api/roadmap');
  });

  it('handles slow API responses', async () => {
    const mockRoadmapData = {
      workstreams: ['Ora'],
      programs: [],
      projects: [],
      tasks: [],
      lastUpdated: '2025-01-20'
    };

    // Simulate slow API response
    mockFetch.mockImplementationOnce(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockRoadmapData)
        } as Response), 100)
      )
    );

    const { result } = renderHook(() => useRoadmapHierarchy());

    // Should remain loading during slow response
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hierarchy).toBeNull();

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.hierarchy).toEqual(mockRoadmapData);
  });
}); 