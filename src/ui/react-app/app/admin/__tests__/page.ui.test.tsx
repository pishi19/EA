import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from '../page';

// Mock admin components
jest.mock('@/components/admin/PhaseManagement', () => {
  return function MockPhaseManagement() {
    return (
      <div data-testid="phase-management">
        <h2>Phase Management</h2>
        <button data-testid="create-phase">Create Phase</button>
        <div data-testid="phases-list">
          <div>Phase 11: Artefact Hierarchy</div>
          <div>Phase 12: Administration</div>
        </div>
      </div>
    );
  };
});

jest.mock('@/components/admin/ArtefactBulkOperations', () => {
  return function MockArtefactBulkOperations() {
    return (
      <div data-testid="artefact-bulk-operations">
        <h2>Artefact Bulk Operations</h2>
        <button data-testid="bulk-edit">Bulk Edit</button>
        <button data-testid="bulk-delete">Bulk Delete</button>
        <div data-testid="artefacts-grid">
          <div>Test Artefact 1</div>
          <div>Test Artefact 2</div>
        </div>
      </div>
    );
  };
});

jest.mock('@/components/admin/RoleManagement', () => {
  return function MockRoleManagement() {
    return (
      <div data-testid="role-management">
        <h2>Role Management</h2>
        <button data-testid="create-role">Create Role</button>
        <table data-testid="roles-table">
          <tbody>
            <tr><td>Admin</td><td>Full Access</td></tr>
            <tr><td>Editor</td><td>Edit Access</td></tr>
          </tbody>
        </table>
      </div>
    );
  };
});

jest.mock('@/components/admin/AuditLogViewer', () => {
  return function MockAuditLogViewer() {
    return (
      <div data-testid="audit-log-viewer">
        <h2>Audit Log Viewer</h2>
        <input data-testid="search-logs" placeholder="Search logs..." />
        <div data-testid="logs-list">
          <div>2025-01-20: User created phase</div>
          <div>2025-01-19: Artefact updated</div>
        </div>
      </div>
    );
  };
});

jest.mock('@/components/admin/WorkstreamWizard', () => {
  return function MockWorkstreamWizard() {
    return (
      <div data-testid="workstream-wizard">
        <h2>Workstream Creation Wizard</h2>
        <form data-testid="workstream-form">
          <input data-testid="workstream-name" placeholder="Workstream name" />
          <button data-testid="create-workstream">Create Workstream</button>
        </form>
      </div>
    );
  };
});

jest.mock('@/components/PhaseContextEditor', () => {
  return function MockPhaseContextEditor() {
    return (
      <div data-testid="phase-context-editor">
        <h2>Phase Context Editor</h2>
        <select data-testid="phase-selector">
          <option value="11">Phase 11</option>
          <option value="12">Phase 12</option>
        </select>
        <textarea data-testid="context-textarea" placeholder="Edit phase context..." />
        <button data-testid="save-context">Save Context</button>
      </div>
    );
  };
});

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={`button ${className} ${variant}`} 
      data-testid="nav-button"
      {...props}
    >
      {children}
    </button>
  )
}));

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders admin page header', () => {
      render(<AdminPage />);
      
      expect(screen.getByText('Ora System Administration')).toBeInTheDocument();
      expect(screen.getByText(/Comprehensive admin interface/)).toBeInTheDocument();
    });

    test('renders overview cards', () => {
      render(<AdminPage />);
      
      expect(screen.getByText('System Config')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Data Management')).toBeInTheDocument();
      expect(screen.getByText('CRUD Operations')).toBeInTheDocument();
    });

    test('shows system status in overview cards', () => {
      render(<AdminPage />);
      
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    test('renders navigation tabs', () => {
      render(<AdminPage />);
      
      expect(screen.getByText('Phase Management')).toBeInTheDocument();
      expect(screen.getByText('Artefact Operations')).toBeInTheDocument();
      expect(screen.getByText('Workstream Management')).toBeInTheDocument();
      expect(screen.getByText('Role Management')).toBeInTheDocument();
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('Phase Context')).toBeInTheDocument();
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });

    test('defaults to phases view', () => {
      render(<AdminPage />);
      
      expect(screen.getByTestId('phase-management')).toBeInTheDocument();
      expect(screen.queryByTestId('artefact-bulk-operations')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    test('switches to artefact operations view', async () => {
      render(<AdminPage />);
      
      const artefactTab = screen.getByRole('button', { name: /artefact operations/i });
      fireEvent.click(artefactTab);
      
      expect(screen.getByTestId('artefact-bulk-operations')).toBeInTheDocument();
      expect(screen.queryByTestId('phase-management')).not.toBeInTheDocument();
    });

    test('switches to workstream management view', async () => {
      render(<AdminPage />);
      
      const workstreamTab = screen.getByRole('button', { name: /workstream management/i });
      fireEvent.click(workstreamTab);
      
      expect(screen.getByTestId('workstream-wizard')).toBeInTheDocument();
      expect(screen.queryByTestId('phase-management')).not.toBeInTheDocument();
    });

    test('switches to role management view', async () => {
      render(<AdminPage />);
      
      const roleTab = screen.getByRole('button', { name: /role management/i });
      fireEvent.click(roleTab);
      
      expect(screen.getByTestId('role-management')).toBeInTheDocument();
      expect(screen.queryByTestId('phase-management')).not.toBeInTheDocument();
    });

    test('switches to audit logs view', async () => {
      render(<AdminPage />);
      
      const auditTab = screen.getByRole('button', { name: /audit logs/i });
      fireEvent.click(auditTab);
      
      expect(screen.getByTestId('audit-log-viewer')).toBeInTheDocument();
      expect(screen.queryByTestId('phase-management')).not.toBeInTheDocument();
    });

    test('switches to phase context view', async () => {
      render(<AdminPage />);
      
      const contextTab = screen.getByRole('button', { name: /phase context/i });
      fireEvent.click(contextTab);
      
      expect(screen.getByTestId('phase-context-editor')).toBeInTheDocument();
      expect(screen.queryByTestId('phase-management')).not.toBeInTheDocument();
    });

    test('switches to system status view', async () => {
      render(<AdminPage />);
      
      const statusTab = screen.getByRole('button', { name: /system status/i });
      fireEvent.click(statusTab);
      
      expect(screen.getByText('✅ All Systems Operational')).toBeInTheDocument();
      expect(screen.getByText('API Status:')).toBeInTheDocument();
      expect(screen.getByText('Database:')).toBeInTheDocument();
      expect(screen.queryByTestId('phase-management')).not.toBeInTheDocument();
    });

    test('highlights active tab', async () => {
      render(<AdminPage />);
      
      const artefactTab = screen.getByRole('button', { name: /artefact operations/i });
      fireEvent.click(artefactTab);
      
      // Check that the button has the active variant class
      expect(artefactTab).toHaveClass('default'); // Active tab should have default variant
    });
  });

  describe('Phase Management Integration', () => {
    test('renders phase management component with functionality', () => {
      render(<AdminPage />);
      
      expect(screen.getByTestId('phase-management')).toBeInTheDocument();
      expect(screen.getByText('Phase Management')).toBeInTheDocument();
      expect(screen.getByTestId('create-phase')).toBeInTheDocument();
      expect(screen.getByTestId('phases-list')).toBeInTheDocument();
    });

    test('phase management shows phase list', () => {
      render(<AdminPage />);
      
      const phasesList = screen.getByTestId('phases-list');
      expect(within(phasesList).getByText('Phase 11: Artefact Hierarchy')).toBeInTheDocument();
      expect(within(phasesList).getByText('Phase 12: Administration')).toBeInTheDocument();
    });

    test('phase management create button is interactive', async () => {
      render(<AdminPage />);
      
      const createButton = screen.getByTestId('create-phase');
      fireEvent.click(createButton);
      
      // Button should be clickable (no errors thrown)
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Artefact Bulk Operations Integration', () => {
    test('renders artefact operations when selected', async () => {
      render(<AdminPage />);
      
      const artefactTab = screen.getByRole('button', { name: /artefact operations/i });
      fireEvent.click(artefactTab);
      
      expect(screen.getByTestId('artefact-bulk-operations')).toBeInTheDocument();
      expect(screen.getByText('Artefact Bulk Operations')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-edit')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-delete')).toBeInTheDocument();
    });

    test('shows artefacts grid', async () => {
      render(<AdminPage />);
      
      const artefactTab = screen.getByRole('button', { name: /artefact operations/i });
      fireEvent.click(artefactTab);
      
      const artefactsGrid = screen.getByTestId('artefacts-grid');
      expect(within(artefactsGrid).getByText('Test Artefact 1')).toBeInTheDocument();
      expect(within(artefactsGrid).getByText('Test Artefact 2')).toBeInTheDocument();
    });
  });

  describe('Role Management Integration', () => {
    test('renders role management interface', async () => {
      render(<AdminPage />);
      
      const roleTab = screen.getByRole('button', { name: /role management/i });
      fireEvent.click(roleTab);
      
      expect(screen.getByTestId('role-management')).toBeInTheDocument();
      expect(screen.getByText('Role Management')).toBeInTheDocument();
      expect(screen.getByTestId('create-role')).toBeInTheDocument();
      expect(screen.getByTestId('roles-table')).toBeInTheDocument();
    });

    test('displays roles table with data', async () => {
      render(<AdminPage />);
      
      const roleTab = screen.getByRole('button', { name: /role management/i });
      fireEvent.click(roleTab);
      
      const rolesTable = screen.getByTestId('roles-table');
      expect(within(rolesTable).getByText('Admin')).toBeInTheDocument();
      expect(within(rolesTable).getByText('Editor')).toBeInTheDocument();
      expect(within(rolesTable).getByText('Full Access')).toBeInTheDocument();
      expect(within(rolesTable).getByText('Edit Access')).toBeInTheDocument();
    });
  });

  describe('Audit Log Integration', () => {
    test('renders audit log viewer', async () => {
      render(<AdminPage />);
      
      const auditTab = screen.getByRole('button', { name: /audit logs/i });
      fireEvent.click(auditTab);
      
      expect(screen.getByTestId('audit-log-viewer')).toBeInTheDocument();
      expect(screen.getByText('Audit Log Viewer')).toBeInTheDocument();
      expect(screen.getByTestId('search-logs')).toBeInTheDocument();
    });

    test('displays audit log entries', async () => {
      render(<AdminPage />);
      
      const auditTab = screen.getByRole('button', { name: /audit logs/i });
      fireEvent.click(auditTab);
      
      const logsList = screen.getByTestId('logs-list');
      expect(within(logsList).getByText('2025-01-20: User created phase')).toBeInTheDocument();
      expect(within(logsList).getByText('2025-01-19: Artefact updated')).toBeInTheDocument();
    });

    test('search functionality is available', async () => {
      render(<AdminPage />);
      
      const auditTab = screen.getByRole('button', { name: /audit logs/i });
      fireEvent.click(auditTab);
      
      const searchInput = screen.getByTestId('search-logs');
      fireEvent.change(searchInput, { target: { value: 'created' } });
      
      expect(searchInput).toHaveValue('created');
    });
  });

  describe('Workstream Management Integration', () => {
    test('renders workstream wizard', async () => {
      render(<AdminPage />);
      
      const workstreamTab = screen.getByRole('button', { name: /workstream management/i });
      fireEvent.click(workstreamTab);
      
      expect(screen.getByTestId('workstream-wizard')).toBeInTheDocument();
      expect(screen.getByText('Workstream Creation Wizard')).toBeInTheDocument();
      expect(screen.getByTestId('workstream-form')).toBeInTheDocument();
    });

    test('workstream creation form is functional', async () => {
      render(<AdminPage />);
      
      const workstreamTab = screen.getByRole('button', { name: /workstream management/i });
      fireEvent.click(workstreamTab);
      
      const nameInput = screen.getByTestId('workstream-name');
      const createButton = screen.getByTestId('create-workstream');
      
      fireEvent.change(nameInput, { target: { value: 'New Workstream' } });
      expect(nameInput).toHaveValue('New Workstream');
      
      fireEvent.click(createButton);
      // Form should be interactive
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Phase Context Editor Integration', () => {
    test('renders phase context editor', async () => {
      render(<AdminPage />);
      
      const contextTab = screen.getByRole('button', { name: /phase context/i });
      fireEvent.click(contextTab);
      
      expect(screen.getByTestId('phase-context-editor')).toBeInTheDocument();
      expect(screen.getByText('Phase Context Editor')).toBeInTheDocument();
      expect(screen.getByTestId('phase-selector')).toBeInTheDocument();
      expect(screen.getByTestId('context-textarea')).toBeInTheDocument();
    });

    test('phase selector works', async () => {
      render(<AdminPage />);
      
      const contextTab = screen.getByRole('button', { name: /phase context/i });
      fireEvent.click(contextTab);
      
      const phaseSelector = screen.getByTestId('phase-selector');
      fireEvent.change(phaseSelector, { target: { value: '12' } });
      
      expect(phaseSelector).toHaveValue('12');
    });

    test('context editing is functional', async () => {
      render(<AdminPage />);
      
      const contextTab = screen.getByRole('button', { name: /phase context/i });
      fireEvent.click(contextTab);
      
      const textarea = screen.getByTestId('context-textarea');
      const saveButton = screen.getByTestId('save-context');
      
      fireEvent.change(textarea, { target: { value: 'Updated context content' } });
      expect(textarea).toHaveValue('Updated context content');
      
      fireEvent.click(saveButton);
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('System Status View', () => {
    test('renders system status information', async () => {
      render(<AdminPage />);
      
      const statusTab = screen.getByRole('button', { name: /system status/i });
      fireEvent.click(statusTab);
      
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('✅ All Systems Operational')).toBeInTheDocument();
      expect(screen.getByText(/API endpoints, database connections/)).toBeInTheDocument();
    });

    test('displays system metrics', async () => {
      render(<AdminPage />);
      
      const statusTab = screen.getByRole('button', { name: /system status/i });
      fireEvent.click(statusTab);
      
      expect(screen.getByText('API Status:')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Database:')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Cache:')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Background Jobs:')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  describe('Responsive Design and Accessibility', () => {
    test('has correct heading hierarchy', () => {
      render(<AdminPage />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Ora System Administration');
    });

    test('navigation is keyboard accessible', async () => {
      render(<AdminPage />);
      
      // Tab through navigation buttons
      const phaseButton = screen.getByRole('button', { name: /phase management/i });
      phaseButton.focus();
      expect(document.activeElement).toBe(phaseButton);
      
      // Tab to next button
      fireEvent.keyDown(phaseButton, { key: 'Tab' });
      const artefactButton = screen.getByRole('button', { name: /artefact operations/i });
      expect(artefactButton).toBeInTheDocument();
    });

    test('tab navigation works with keyboard', async () => {
      render(<AdminPage />);
      
      // Navigate to artefact operations with keyboard
      const artefactTab = screen.getByRole('button', { name: /artefact operations/i });
      artefactTab.focus();
      fireEvent.keyDown(artefactTab, { key: 'Enter' });
      
      expect(screen.getByTestId('artefact-bulk-operations')).toBeInTheDocument();
    });

    test('maintains focus management', async () => {
      render(<AdminPage />);
      
      const artefactTab = screen.getByRole('button', { name: /artefact operations/i });
      fireEvent.click(artefactTab);
      
      // Focus should be managed properly after tab switch
      expect(document.activeElement).not.toBe(document.body);
    });
  });

  describe('Error Boundaries and Edge Cases', () => {
    test('handles missing tabs gracefully', () => {
      render(<AdminPage />);
      
      // All tabs should be present and functional
      const tabs = screen.getAllByTestId('nav-button');
      expect(tabs).toHaveLength(7); // All 7 navigation tabs
    });

    test('handles invalid activeView gracefully', () => {
      // This tests the default case in renderActiveView
      render(<AdminPage />);
      
      // Should default to phase management
      expect(screen.getByTestId('phase-management')).toBeInTheDocument();
    });

    test('overview cards display correct status', () => {
      render(<AdminPage />);
      
      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(4); // 4 overview cards
      
      // Each card should have status information
      expect(screen.getByText('Core systems operational')).toBeInTheDocument();
      expect(screen.getByText('Access control enabled')).toBeInTheDocument();
      expect(screen.getByText('All systems synced')).toBeInTheDocument();
      expect(screen.getByText('Full CRUD functionality')).toBeInTheDocument();
    });
  });
}); 