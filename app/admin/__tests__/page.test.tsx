import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '../page';

// Mock the admin components
jest.mock('@/components/admin/PhaseManagement', () => {
  return function MockPhaseManagement() {
    return (
      <div data-testid="phase-management">
        <h2>Phase Management</h2>
        <p>Manage system phases and roadmap</p>
        <div>Phase 11: Artefact Hierarchy</div>
        <div>Phase 12: Administration</div>
      </div>
    );
  };
});

jest.mock('@/components/admin/ArtefactBulkOperations', () => {
  return function MockArtefactBulkOperations() {
    return (
      <div data-testid="artefact-operations">
        <h2>Artefact Operations</h2>
        <p>Bulk operations for artefacts</p>
      </div>
    );
  };
});

jest.mock('@/components/admin/RoleManagement', () => {
  return function MockRoleManagement() {
    return (
      <div data-testid="role-management">
        <h2>Role Management</h2>
        <p>Manage user roles and permissions</p>
      </div>
    );
  };
});

jest.mock('@/components/admin/AuditLogViewer', () => {
  return function MockAuditLogViewer() {
    return (
      <div data-testid="audit-logs">
        <h2>Audit Logs</h2>
        <p>View system audit logs</p>
      </div>
    );
  };
});

jest.mock('@/components/admin/WorkstreamWizard', () => {
  return function MockWorkstreamWizard() {
    return (
      <div data-testid="workstream-wizard">
        <h2>Workstream Wizard</h2>
        <p>Create and configure workstreams</p>
      </div>
    );
  };
});

jest.mock('@/components/PhaseContextEditor', () => {
  return function MockPhaseContextEditor() {
    return (
      <div data-testid="phase-context-editor">
        <h2>Phase Context Editor</h2>
        <p>Edit phase context and strategic focus</p>
      </div>
    );
  };
});

describe('AdminPage', () => {
  beforeEach(() => {
    // Clear any previous renders
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render admin interface with header', () => {
      render(<AdminPage />);
      
      expect(screen.getByText('Ora System Administration')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive admin interface for phases, projects, artefacts, workstreams, roles, and system configuration')).toBeInTheDocument();
    });

    it('should render all overview cards', () => {
      render(<AdminPage />);
      
      // Check for overview cards
      expect(screen.getByText('System Config')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Data Management')).toBeInTheDocument();
      expect(screen.getByText('CRUD Operations')).toBeInTheDocument();
      
      // Check card statuses
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(<AdminPage />);
      
      expect(screen.getByRole('button', { name: /Phase Management/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Artefact Operations/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Workstream Management/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Role Management/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Audit Logs/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Phase Context/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /System Status/i })).toBeInTheDocument();
    });

    it('should show Phase Management by default', () => {
      render(<AdminPage />);
      
      expect(screen.getByTestId('phase-management')).toBeInTheDocument();
      expect(screen.getByText('Manage system phases and roadmap')).toBeInTheDocument();
    });
  });

  describe('Navigation and View Switching', () => {
    it('should switch to artefact operations view', () => {
      render(<AdminPage />);
      
      fireEvent.click(screen.getByRole('button', { name: /Artefact Operations/i }));
      
      expect(screen.getByTestId('artefact-operations')).toBeInTheDocument();
      expect(screen.getByText('Bulk operations for artefacts')).toBeInTheDocument();
    });

    it('should switch to role management view', () => {
      render(<AdminPage />);
      
      fireEvent.click(screen.getByRole('button', { name: /Role Management/i }));
      
      expect(screen.getByTestId('role-management')).toBeInTheDocument();
      expect(screen.getByText('Manage user roles and permissions')).toBeInTheDocument();
    });

    it('should switch to audit logs view', () => {
      render(<AdminPage />);
      
      fireEvent.click(screen.getByRole('button', { name: /Audit Logs/i }));
      
      expect(screen.getByTestId('audit-logs')).toBeInTheDocument();
      expect(screen.getByText('View system audit logs')).toBeInTheDocument();
    });

    it('should switch to workstream wizard view', () => {
      render(<AdminPage />);
      
      fireEvent.click(screen.getByRole('button', { name: /Workstream Management/i }));
      
      expect(screen.getByTestId('workstream-wizard')).toBeInTheDocument();
      expect(screen.getByText('Create and configure workstreams')).toBeInTheDocument();
    });

    it('should switch to phase context view', () => {
      render(<AdminPage />);
      
      fireEvent.click(screen.getByRole('button', { name: /Phase Context/i }));
      
      expect(screen.getByTestId('phase-context-editor')).toBeInTheDocument();
      expect(screen.getByText('Edit phase context and strategic focus')).toBeInTheDocument();
    });

    it('should show system status view', () => {
      render(<AdminPage />);
      
      fireEvent.click(screen.getByRole('button', { name: /System Status/i }));
      
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('✅ All Systems Operational')).toBeInTheDocument();
      expect(screen.getByText('API endpoints, database connections, and core services are running normally.')).toBeInTheDocument();
    });

    it('should highlight active navigation button', () => {
      render(<AdminPage />);
      
      const phaseButton = screen.getByRole('button', { name: /Phase Management/i });
      expect(phaseButton).toHaveClass('bg-primary');
      
      fireEvent.click(screen.getByRole('button', { name: /Role Management/i }));
      
      const roleButton = screen.getByRole('button', { name: /Role Management/i });
      expect(roleButton).toHaveClass('bg-primary');
    });
  });

  describe('System Status Features', () => {
    it('should display system health information', () => {
      render(<AdminPage />);
      
      fireEvent.click(screen.getByRole('button', { name: /System Status/i }));
      
      expect(screen.getByText('API Status:')).toBeInTheDocument();
      expect(screen.getByText('Database:')).toBeInTheDocument();
      expect(screen.getByText('Cache:')).toBeInTheDocument();
      expect(screen.getByText('Background Jobs:')).toBeInTheDocument();
      
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  describe('Responsive Design and Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<AdminPage />);
      
      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ora System Administration');
    });

    it('should have accessible navigation controls', () => {
      render(<AdminPage />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(7); // 7 navigation buttons
      
      buttons.forEach(button => {
        expect(button).toBeVisible();
        expect(button).toBeEnabled();
      });
    });

    it('should have proper ARIA labels and roles', () => {
      render(<AdminPage />);
      
      const nav = screen.getByRole('main', { hidden: true }) || screen.getByText('Ora System Administration').closest('div');
      expect(nav).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<AdminPage />);
      
      const firstButton = screen.getByRole('button', { name: /Phase Management/i });
      firstButton.focus();
      expect(firstButton).toHaveFocus();
    });
  });

  describe('Component Integration', () => {
    it('should properly integrate with all admin components', () => {
      render(<AdminPage />);
      
      // Test each view loads properly
      const views = [
        { button: /Phase Management/i, testId: 'phase-management' },
        { button: /Artefact Operations/i, testId: 'artefact-operations' },
        { button: /Role Management/i, testId: 'role-management' },
        { button: /Audit Logs/i, testId: 'audit-logs' },
        { button: /Workstream Management/i, testId: 'workstream-wizard' },
        { button: /Phase Context/i, testId: 'phase-context-editor' }
      ];
      
      views.forEach(({ button, testId }) => {
        fireEvent.click(screen.getByRole('button', { name: button }));
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      });
    });

    it('should maintain state during view switches', () => {
      render(<AdminPage />);
      
      // Switch views multiple times
      fireEvent.click(screen.getByRole('button', { name: /Role Management/i }));
      fireEvent.click(screen.getByRole('button', { name: /Audit Logs/i }));
      fireEvent.click(screen.getByRole('button', { name: /Phase Management/i }));
      
      expect(screen.getByTestId('phase-management')).toBeInTheDocument();
    });
  });

  describe('Visual Design Elements', () => {
    it('should render with proper styling classes', () => {
      render(<AdminPage />);
      
      const container = screen.getByText('Ora System Administration').closest('div');
      expect(container?.parentElement).toHaveClass('container', 'mx-auto', 'px-4', 'py-8');
    });

    it('should display icons with correct styling', () => {
      render(<AdminPage />);
      
      // SVG icons should be present
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have proper color coding for status cards', () => {
      render(<AdminPage />);
      
      const systemConfig = screen.getByText('System Config').closest('div')?.parentElement;
      expect(systemConfig).toHaveClass('border-2', 'border-blue-200');
      
      const userManagement = screen.getByText('User Management').closest('div')?.parentElement;
      expect(userManagement).toHaveClass('border-2', 'border-green-200');
    });
  });

  describe('Performance and Error Handling', () => {
    it('should render quickly without performance issues', () => {
      const startTime = performance.now();
      render(<AdminPage />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should handle view switching without errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<AdminPage />);
      
      // Rapidly switch between views
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByRole('button', { name: /Role Management/i }));
        fireEvent.click(screen.getByRole('button', { name: /Phase Management/i }));
      }
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
}); 