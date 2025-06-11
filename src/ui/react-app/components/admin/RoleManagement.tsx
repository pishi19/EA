"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  UserPlus,
  Key
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  workstreams: string[];
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
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

const AVAILABLE_PERMISSIONS = [
  'read', 'write', 'delete', 'chat', 'mutate', 'admin'
];

const AVAILABLE_WORKSTREAMS = [
  'ora', 'mecca', 'sales'
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    workstreams: [] as string[]
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    roles: [] as string[],
    workstreams: [] as string[],
    status: 'active' as 'active' | 'inactive'
  });

  const fetchRolesAndUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/roles', {
        headers: {
          'x-workstream': 'ora' // Default workstream for admin access
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles and users: ${response.status}`);
      }

      const data = await response.json();
      setRoles(data.roles || []);
      setUsers(data.users || []);

    } catch (err) {
      console.error('Error fetching roles and users:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndUsers();
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: [],
      workstreams: []
    });
    setEditingRole(null);
  };

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      roles: [],
      workstreams: [],
      status: 'active'
    });
    setEditingUser(null);
  };

  const openRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
        workstreams: [...role.workstreams]
      });
    } else {
      resetRoleForm();
    }
    setIsRoleModalOpen(true);
    clearMessages();
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        roles: [...user.roles],
        workstreams: [...user.workstreams],
        status: user.status
      });
    } else {
      resetUserForm();
    }
    setIsUserModalOpen(true);
    clearMessages();
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  const getRolePermissions = (roleIds: string[]) => {
    const roleObjects = roles.filter(r => roleIds.includes(r.id));
    const allPermissions = new Set<string>();
    roleObjects.forEach(role => {
      role.permissions.forEach(permission => allPermissions.add(permission));
    });
    return Array.from(allPermissions);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Role & User Management
          </h2>
          <p className="text-muted-foreground">
            Manage roles, permissions, and user access across workstreams
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => openRoleModal()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Role
          </Button>
          <Button 
            onClick={() => openUserModal()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            New User
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Roles Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Roles ({roles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <Card key={role.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{role.name}</h4>
                      {role.isSystem && <Badge variant="outline" className="text-xs mt-1">System</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRoleModal(role)}
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {role.description || 'No description'}
                  </p>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Permissions</div>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map(permission => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Workstreams</div>
                      <div className="flex flex-wrap gap-1">
                        {role.workstreams.includes('*') ? (
                          <Badge className="text-xs bg-blue-100 text-blue-800">All</Badge>
                        ) : (
                          role.workstreams.map(ws => (
                            <Badge key={ws} variant="outline" className="text-xs">
                              {ws}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => (
              <Card key={user.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        {getStatusBadge(user.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Roles</div>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map(roleId => {
                              const role = roles.find(r => r.id === roleId);
                              return (
                                <Badge key={roleId} variant="secondary" className="text-xs">
                                  {role?.name || roleId}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Workstreams</div>
                          <div className="flex flex-wrap gap-1">
                            {user.workstreams.includes('*') ? (
                              <Badge className="text-xs bg-blue-100 text-blue-800">All</Badge>
                            ) : (
                              user.workstreams.map(ws => (
                                <Badge key={ws} variant="outline" className="text-xs">
                                  {ws}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Effective Permissions</div>
                          <div className="flex flex-wrap gap-1">
                            {getRolePermissions(user.roles).map(permission => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {user.lastLogin && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Last login: {new Date(user.lastLogin).toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUserModal(user)}
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
