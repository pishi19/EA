import { NextRequest, NextResponse } from 'next/server';
import { withWorkstreamContext, logWorkstreamOperation } from '@/lib/workstream-api';
import path from 'path';
import fs from 'fs';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  workstreams: string[];
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  workstreams: string[];
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Default system roles
const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access across all workstreams',
    permissions: ['read', 'write', 'delete', 'chat', 'mutate', 'admin'],
    workstreams: ['*'],
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can create and edit content within assigned workstreams',
    permissions: ['read', 'write', 'chat', 'mutate'],
    workstreams: [],
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to assigned workstreams',
    permissions: ['read', 'chat'],
    workstreams: [],
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Default demo users
const DEFAULT_USERS: User[] = [
  {
    id: 'system',
    name: 'System Admin',
    email: 'admin@ora-system.local',
    roles: ['admin'],
    workstreams: ['*'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ash',
    name: 'Ash (Owner)',
    email: 'ash@ora-system.local',
    roles: ['admin'],
    workstreams: ['ora', 'mecca', 'sales'],
    status: 'active',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'demo-editor',
    name: 'Demo Editor',
    email: 'editor@ora-system.local',
    roles: ['editor'],
    workstreams: ['ora'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function getRolesAndUsers(): Promise<{ roles: Role[]; users: User[] }> {
  // Get project root
  const projectRoot = process.cwd().includes('react-app') 
    ? path.resolve(process.cwd(), '../../..')
    : process.cwd();

  const configPath = path.join(projectRoot, 'runtime', 'config');
  const rolesFile = path.join(configPath, 'roles.json');
  const usersFile = path.join(configPath, 'users.json');

  let roles: Role[] = DEFAULT_ROLES;
  let users: User[] = DEFAULT_USERS;

  // Read existing roles if file exists
  if (fs.existsSync(rolesFile)) {
    try {
      const rolesData = fs.readFileSync(rolesFile, 'utf-8');
      const savedRoles = JSON.parse(rolesData);
      // Merge system roles with saved custom roles
      const customRoles = savedRoles.filter((r: Role) => !r.isSystem);
      roles = [...DEFAULT_ROLES, ...customRoles];
    } catch (error) {
      console.error('Error reading roles file:', error);
    }
  }

  // Read existing users if file exists
  if (fs.existsSync(usersFile)) {
    try {
      const usersData = fs.readFileSync(usersFile, 'utf-8');
      users = JSON.parse(usersData);
    } catch (error) {
      console.error('Error reading users file:', error);
    }
  }

  return { roles, users };
}

// GET - List all roles and users
export const GET = withWorkstreamContext(async (request: NextRequest, context) => {
  const { roles, users } = await getRolesAndUsers();
  
  await logWorkstreamOperation({
    workstream: context.workstream,
    operation: 'read',
    endpoint: '/api/roles',
    data: { roleCount: roles.length, userCount: users.length },
    result: 'success'
  });

  return NextResponse.json({ roles, users });
});
