/**
 * Client-safe workstream types and configuration
 * Contains interfaces and constants that can be safely imported in browser components
 */

export interface WorkstreamConfig {
  name: string;
  displayName: string;
  description: string;
  status: 'active' | 'planning' | 'archived';
  dataPath: string;
  allowedOperations: string[];
  owner?: string;
  phase?: string;
  color?: string;
}

export interface WorkstreamTemplate {
  name: string;
  displayName: string;
  description: string;
  config: Partial<WorkstreamConfig>;
  structure: {
    roadmap: boolean;
    artefacts: boolean;
    logs: boolean;
    customFolders: string[];
  };
}

export const OPERATION_OPTIONS = [
  { value: 'read', label: 'Read', description: 'View artefacts and data' },
  { value: 'write', label: 'Write', description: 'Create and edit content' },
  { value: 'delete', label: 'Delete', description: 'Remove artefacts' },
  { value: 'chat', label: 'Chat', description: 'LLM interactions' },
  { value: 'mutate', label: 'Mutate', description: 'Advanced mutations' },
  { value: 'admin', label: 'Admin', description: 'Administrative access' }
];

export const WORKSTREAM_TEMPLATES: WorkstreamTemplate[] = [
  {
    name: 'development',
    displayName: 'Development Project',
    description: 'Standard development workstream with full capabilities',
    config: {
      status: 'active',
      allowedOperations: ['read', 'write', 'delete', 'chat', 'mutate'],
      phase: '1 - Planning & Setup'
    },
    structure: {
      roadmap: true,
      artefacts: true,
      logs: true,
      customFolders: ['docs', 'tests']
    }
  },
  {
    name: 'business',
    displayName: 'Business Initiative',
    description: 'Business-focused workstream with collaboration features',
    config: {
      status: 'planning',
      allowedOperations: ['read', 'write', 'chat'],
      phase: '1 - Discovery & Analysis'
    },
    structure: {
      roadmap: true,
      artefacts: true,
      logs: true,
      customFolders: ['reports', 'presentations']
    }
  },
  {
    name: 'minimal',
    displayName: 'Minimal Setup',
    description: 'Basic workstream with essential features only',
    config: {
      status: 'planning',
      allowedOperations: ['read', 'write'],
      phase: '1 - Initial Setup'
    },
    structure: {
      roadmap: true,
      artefacts: true,
      logs: false,
      customFolders: []
    }
  }
];

export const DEFAULT_WORKSTREAMS: WorkstreamConfig[] = [
  {
    name: 'ora',
    displayName: 'Ora System',
    description: 'Context-aware autonomous agent - Core system development',
    status: 'active',
    dataPath: '/runtime/workstreams/ora',
    allowedOperations: ['read', 'write', 'delete', 'chat', 'mutate'],
    owner: 'System Team',
    phase: '11 - Filtering & Hierarchy',
    color: '#3b82f6'
  },
  {
    name: 'mecca',
    displayName: 'Mecca Project',
    description: 'Strategic business development initiative',
    status: 'planning',
    dataPath: '/runtime/workstreams/mecca',
    allowedOperations: ['read', 'write', 'chat', 'mutate'],
    owner: 'Business Team',
    phase: '1 - Foundation & Planning',
    color: '#10b981'
  },
  {
    name: 'sales',
    displayName: 'Sales & Marketing',
    description: 'Customer acquisition and marketing operations',
    status: 'planning',
    dataPath: '/runtime/workstreams/sales',
    allowedOperations: ['read', 'write', 'chat', 'mutate'],
    owner: 'Revenue Team',
    phase: '1 - Customer Acquisition',
    color: '#8b5cf6'
  }
];

export const validateWorkstreamName = (name: string, existingNames: string[] = []): string | null => {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  if (!/^[a-z0-9-]+$/.test(name)) return 'Name must contain only lowercase letters, numbers, and hyphens';
  if (existingNames.includes(name)) return 'Workstream name already exists';
  return null;
}; 