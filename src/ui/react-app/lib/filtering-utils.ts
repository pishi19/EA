// Type definitions for loop data
interface LoopData {
  id: string;
  title: string;
  tags?: string[];
  workstream?: string;
  score: number;
  status: string;
  created: string;
  [key: string]: any; // Allow additional properties
}

// Type badge configuration
interface TypeBadge {
  icon: JSX.Element | null;
  label: string;
  color: string;
}

/**
 * Determines the type badge based on loop tags
 */
export function getTypeBadge(tags?: string[]): TypeBadge {
  if (!tags || tags.length === 0) {
    return {
      icon: null,
      label: 'Execution',
      color: 'bg-green-100 text-green-800'
    };
  }

  // Check for planning tags
  if (tags.some(tag => tag.includes('planning') || tag.includes('strategic'))) {
    return {
      icon: null,
      label: 'Planning',
      color: 'bg-blue-100 text-blue-800'
    };
  }

  // Check for retrospective tags
  if (tags.some(tag => tag.includes('retrospective') || tag.includes('review'))) {
    return {
      icon: null,
      label: 'Retrospective',
      color: 'bg-amber-100 text-amber-800'
    };
  }

  // Default to execution
  return {
    icon: null,
    label: 'Execution',
    color: 'bg-green-100 text-green-800'
  };
}

/**
 * Filters loops by workstream
 */
export function filterLoopsByWorkstream(loops: LoopData[], workstream: string): LoopData[] {
  if (workstream === 'all') {
    return loops;
  }

  return loops.filter(loop => loop.workstream === workstream);
}

/**
 * Sorts loops by score
 */
export function sortLoopsByScore(loops: LoopData[], direction: 'asc' | 'desc'): LoopData[] {
  const sorted = [...loops];
  
  return sorted.sort((a, b) => {
    if (direction === 'asc') {
      return a.score - b.score;
    }
    return b.score - a.score; // default to desc
  });
}

/**
 * Filters loops by multiple criteria
 */
export function filterLoops(
  loops: LoopData[],
  filters: {
    workstream?: string;
    status?: string;
    type?: string;
    tags?: string[];
  }
): LoopData[] {
  let filtered = loops;

  // Filter by workstream
  if (filters.workstream && filters.workstream !== 'all') {
    filtered = filterLoopsByWorkstream(filtered, filters.workstream);
  }

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(loop => loop.status === filters.status);
  }

  // Filter by type (based on tags)
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(loop => {
      const typeBadge = getTypeBadge(loop.tags);
      return typeBadge.label.toLowerCase() === filters.type!.toLowerCase();
    });
  }

  // Filter by tags
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(loop => 
      filters.tags!.some(tag => loop.tags && loop.tags.includes(tag))
    );
  }

  return filtered;
}

/**
 * Sorts loops by various criteria
 */
export function sortLoops(
  loops: LoopData[],
  sortBy: 'created_desc' | 'created_asc' | 'score_desc' | 'score_asc' | 'title_asc' | 'workstream_asc'
): LoopData[] {
  const sorted = [...loops];

  return sorted.sort((a, b) => {
    switch (sortBy) {
      case 'score_desc':
        return b.score - a.score;
      case 'score_asc':
        return a.score - b.score;
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'workstream_asc':
        return (a.workstream || '').localeCompare(b.workstream || '');
      case 'created_asc':
        return new Date(a.created).getTime() - new Date(b.created).getTime();
      case 'created_desc':
      default:
        return new Date(b.created).getTime() - new Date(a.created).getTime();
    }
  });
}

/**
 * Gets unique values from loops for filter options
 */
export function getUniqueValues(loops: LoopData[], property: keyof LoopData): string[] {
  const values = new Set<string>();
  
  loops.forEach(loop => {
    const value = loop[property];
    if (value && typeof value === 'string') {
      values.add(value);
    } else if (Array.isArray(value)) {
      value.forEach(item => {
        if (typeof item === 'string') {
          values.add(item);
        }
      });
    }
  });

  return Array.from(values).sort();
}

/**
 * Combines filtering and sorting in one operation
 */
export function processLoops(
  loops: LoopData[],
  filters: {
    workstream?: string;
    status?: string;
    type?: string;
    tags?: string[];
  },
  sortBy: 'created_desc' | 'created_asc' | 'score_desc' | 'score_asc' | 'title_asc' | 'workstream_asc'
): LoopData[] {
  const filtered = filterLoops(loops, filters);
  return sortLoops(filtered, sortBy);
} 