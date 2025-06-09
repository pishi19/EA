import { getTypeBadge, filterLoopsByWorkstream, sortLoopsByScore } from '../filtering-utils';

// Mock loop data for testing
const mockLoops = [
  {
    id: 'loop-1',
    title: 'Planning Loop',
    tags: ['planning', 'strategic'],
    workstream: 'strategy',
    score: 8.5,
    status: 'complete',
    created: '2024-01-01T00:00:00Z'
  },
  {
    id: 'loop-2',
    title: 'Execution Loop',
    tags: ['implementation', 'development'],
    workstream: 'development',
    score: 7.2,
    status: 'in_progress',
    created: '2024-01-02T00:00:00Z'
  },
  {
    id: 'loop-3',
    title: 'Retrospective Loop',
    tags: ['retrospective', 'review'],
    workstream: 'quality',
    score: 9.1,
    status: 'complete',
    created: '2024-01-03T00:00:00Z'
  }
];

describe('Filtering Utils', () => {
  describe('getTypeBadge', () => {
    it('returns planning badge for planning tags', () => {
      const badge = getTypeBadge(['planning', 'strategic']);
      expect(badge.label).toBe('Planning');
      expect(badge.color).toBe('bg-blue-100 text-blue-800');
    });

    it('returns retrospective badge for retrospective tags', () => {
      const badge = getTypeBadge(['retrospective', 'review']);
      expect(badge.label).toBe('Retrospective');
      expect(badge.color).toBe('bg-amber-100 text-amber-800');
    });

    it('returns execution badge by default', () => {
      const badge = getTypeBadge(['implementation', 'development']);
      expect(badge.label).toBe('Execution');
      expect(badge.color).toBe('bg-green-100 text-green-800');
    });

    it('handles empty tags array', () => {
      const badge = getTypeBadge([]);
      expect(badge.label).toBe('Execution');
      expect(badge.color).toBe('bg-green-100 text-green-800');
    });

    it('handles undefined tags', () => {
      const badge = getTypeBadge(undefined);
      expect(badge.label).toBe('Execution');
      expect(badge.color).toBe('bg-green-100 text-green-800');
    });

    it('prioritizes planning over other tags', () => {
      const badge = getTypeBadge(['development', 'planning', 'review']);
      expect(badge.label).toBe('Planning');
    });

    it('prioritizes retrospective when no planning tags', () => {
      const badge = getTypeBadge(['development', 'retrospective', 'implementation']);
      expect(badge.label).toBe('Retrospective');
    });
  });

  describe('filterLoopsByWorkstream', () => {
    it('returns all loops when filter is "all"', () => {
      const filtered = filterLoopsByWorkstream(mockLoops, 'all');
      expect(filtered).toHaveLength(3);
      expect(filtered).toEqual(mockLoops);
    });

    it('filters loops by specific workstream', () => {
      const filtered = filterLoopsByWorkstream(mockLoops, 'development');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].workstream).toBe('development');
    });

    it('returns empty array for non-existent workstream', () => {
      const filtered = filterLoopsByWorkstream(mockLoops, 'non-existent');
      expect(filtered).toHaveLength(0);
    });

    it('handles empty loops array', () => {
      const filtered = filterLoopsByWorkstream([], 'development');
      expect(filtered).toHaveLength(0);
    });

    it('handles case-sensitive workstream matching', () => {
      const filtered = filterLoopsByWorkstream(mockLoops, 'Development');
      expect(filtered).toHaveLength(0); // Should be case-sensitive
    });
  });

  describe('sortLoopsByScore', () => {
    it('sorts loops by score descending', () => {
      const sorted = sortLoopsByScore([...mockLoops], 'desc');
      expect(sorted[0].score).toBe(9.1);
      expect(sorted[1].score).toBe(8.5);
      expect(sorted[2].score).toBe(7.2);
    });

    it('sorts loops by score ascending', () => {
      const sorted = sortLoopsByScore([...mockLoops], 'asc');
      expect(sorted[0].score).toBe(7.2);
      expect(sorted[1].score).toBe(8.5);
      expect(sorted[2].score).toBe(9.1);
    });

    it('handles empty array', () => {
      const sorted = sortLoopsByScore([], 'desc');
      expect(sorted).toHaveLength(0);
    });

    it('handles single item array', () => {
      const singleLoop = [mockLoops[0]];
      const sorted = sortLoopsByScore(singleLoop, 'desc');
      expect(sorted).toHaveLength(1);
      expect(sorted[0]).toEqual(mockLoops[0]);
    });

    it('maintains stable sort for equal scores', () => {
      const loopsWithEqualScores = [
        { ...mockLoops[0], score: 8.0 },
        { ...mockLoops[1], score: 8.0 },
        { ...mockLoops[2], score: 9.0 }
      ];
      
      const sorted = sortLoopsByScore(loopsWithEqualScores, 'desc');
      expect(sorted[0].score).toBe(9.0);
      expect(sorted[1].score).toBe(8.0);
      expect(sorted[2].score).toBe(8.0);
      
      // Should maintain original order for equal scores
      expect(sorted[1].id).toBe('loop-1');
      expect(sorted[2].id).toBe('loop-2');
    });

    it('handles invalid sort direction gracefully', () => {
      const sorted = sortLoopsByScore([...mockLoops], 'invalid' as any);
      // Should default to descending
      expect(sorted[0].score).toBe(9.1);
    });
  });

  describe('Complex Filtering Scenarios', () => {
    it('combines workstream filtering and score sorting', () => {
      const extendedLoops = [
        ...mockLoops,
        {
          id: 'loop-4',
          title: 'Another Development Loop',
          tags: ['development'],
          workstream: 'development',
          score: 8.8,
          status: 'complete',
          created: '2024-01-04T00:00:00Z'
        }
      ];

      const filtered = filterLoopsByWorkstream(extendedLoops, 'development');
      const sorted = sortLoopsByScore(filtered, 'desc');
      
      expect(sorted).toHaveLength(2);
      expect(sorted[0].score).toBe(8.8);
      expect(sorted[1].score).toBe(7.2);
    });

    it('handles null and undefined values gracefully', () => {
      const loopsWithNulls = [
        { ...mockLoops[0], workstream: null },
        { ...mockLoops[1], workstream: undefined },
        mockLoops[2]
      ];

      const filtered = filterLoopsByWorkstream(loopsWithNulls as any, 'quality');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].workstream).toBe('quality');
    });

    it('preserves all properties during filtering and sorting', () => {
      const filtered = filterLoopsByWorkstream(mockLoops, 'strategy');
      const sorted = sortLoopsByScore(filtered, 'desc');
      
      expect(sorted[0]).toMatchObject({
        id: 'loop-1',
        title: 'Planning Loop',
        tags: ['planning', 'strategic'],
        workstream: 'strategy',
        score: 8.5,
        status: 'complete',
        created: '2024-01-01T00:00:00Z'
      });
    });
  });

  describe('Performance Tests', () => {
    it('handles large datasets efficiently', () => {
      // Generate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `loop-${i}`,
        title: `Loop ${i}`,
        tags: i % 2 === 0 ? ['planning'] : ['execution'],
        workstream: `workstream-${i % 10}`,
        score: Math.random() * 10,
        status: 'complete',
        created: new Date(2024, 0, i + 1).toISOString()
      }));

      const start = Date.now();
      const filtered = filterLoopsByWorkstream(largeDataset, 'workstream-5');
      const sorted = sortLoopsByScore(filtered, 'desc');
      const end = Date.now();

      expect(sorted.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(100); // Should complete quickly
    });
  });
}); 