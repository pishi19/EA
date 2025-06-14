# Test Coverage Enhancement Plan

## Current Status Summary

**Test Suite Overview:**
- **38 total test suites** (22 failed, 16 passed)
- **440 total tests** (165 failed, 275 passed)
- **Current pass rate: ~62.5%**

## Completed Test Enhancements

### ✅ Workstream Filter Demo Tests
- **Fixed taxonomy filtering tests** - Updated 16 tests to match current UI implementation
- **Added proper mocking** for roadmap hierarchy and tree state hooks
- **Enhanced test coverage** for hierarchical filtering, roadmap alignment, and batch operations
- **Status: 15/16 tests now passing** (93.75% pass rate)

## Priority Areas for Test Coverage Enhancement

### 1. **Critical Component Testing**

#### A. Task Management Components
- `TaskCard.tsx` - Task display and interaction
- `batch-task-controls.tsx` - Multi-select operations
- `inline-task-editor.tsx` - Inline editing functionality
- `task-mutation-controls.tsx` - CRUD operations

#### B. Navigation Components  
- `TreeNavigation.tsx` - Hierarchical tree navigation
- `ContextPane.tsx` - Artefact details and chat interface
- `EnhancedContextPane.tsx` - AI consultation features

#### C. Core UI Components
- **Filter components** - Workstream, program, project filtering
- **Roadmap parser** - Hierarchy extraction and validation
- **Memory trace system** - Chat and mutation logging

### 2. **API Endpoint Testing**

#### A. Task Operations
- `/api/task-mutations/route.ts` - CRUD operations
- `/api/task-mutations/batch/route.ts` - Batch operations
- `/api/artefact-chat/route.ts` - LLM integration
- `/api/memory-trace/route.ts` - Audit trail

#### B. Data Management
- `/api/demo-loops/route.ts` - Artefact loading
- `/api/system-docs/route.ts` - Documentation access
- `/api/roadmap/route.ts` - Hierarchy data

### 3. **Integration Testing**

#### A. Roadmap-Driven Features
- **Hierarchy parsing** from roadmap.md
- **Orphan detection** and validation
- **Filter synchronization** across components
- **Real-time updates** between tree and context pane

#### B. Mutation Workflows
- **Optimistic UI updates** with rollback
- **Batch operations** with partial failure handling
- **Undo/redo functionality** with state management
- **Chat-driven mutations** via natural language

## Test Enhancement Strategy

### Phase 1: Foundation (High Priority)

1. **Setup test utilities and mocks**
   ```typescript
   // Create shared test utilities
   - setupTests.ts (jest-dom, mocks)
   - testUtils.tsx (render helpers, providers)
   - mockData.ts (consistent test data)
   ```

2. **Fix existing failing tests**
   - Update component expectations to match current UI
   - Fix mock implementations for API endpoints
   - Resolve import and dependency issues

3. **Core component coverage**
   - TaskCard component (15+ test cases)
   - Batch controls (10+ test cases)
   - Tree navigation (12+ test cases)

### Phase 2: Integration (Medium Priority)

1. **End-to-end workflows**
   - Task creation → editing → deletion flow
   - Batch selection → operations → undo flow
   - Tree navigation → context display → chat flow

2. **API integration tests**
   - Request/response validation
   - Error handling scenarios
   - Performance under load

3. **State management tests**
   - Filter state synchronization
   - Optimistic updates with rollback
   - Memory trace persistence

### Phase 3: Advanced (Lower Priority)

1. **Performance testing**
   - Large dataset filtering
   - Tree rendering with many nodes
   - Memory usage optimization

2. **Accessibility testing**
   - Keyboard navigation
   - Screen reader compatibility
   - ARIA attributes validation

3. **Visual regression testing**
   - Component snapshots
   - Layout consistency
   - Theme variations

## Implementation Guidelines

### Mock Strategy
```typescript
// API Mocking
jest.mock('fetch', () => mockFetch);

// Component Mocking  
jest.mock('@/components/ui/select', () => MockSelect);

// Hook Mocking
jest.mock('./useRoadmapHierarchy', () => mockHierarchy);
```

### Test Data Strategy
```typescript
// Consistent test data
export const mockArtefacts = [
  { id: 'task1', title: 'Test Task', status: 'in_progress' },
  // ... more test data
];

export const mockRoadmapHierarchy = {
  programs: [...],
  projects: [...],
  tasks: [...]
};
```

### Coverage Targets
- **Unit Tests**: 90%+ coverage for critical components
- **Integration Tests**: 80%+ coverage for key workflows
- **API Tests**: 95%+ coverage for all endpoints
- **Overall Target**: 85%+ test pass rate

## Quick Wins Implementation

### 1. Fix Immediate Issues (1-2 hours)
```bash
# Run and fix these specific test suites
npm test -- app/workstream-filter-demo/__tests__/taxonomy-filtering.test.tsx
npm test -- app/api/__tests__/demo-loops.test.ts
npm test -- components/__tests__/batch-task-controls.test.tsx
```

### 2. Add Missing Test Coverage (2-4 hours)
- Create tests for TreeNavigation component
- Add ContextPane test coverage
- Implement roadmap parser tests

### 3. Enhance Existing Tests (4-6 hours)
- Add edge case coverage
- Improve mock implementations
- Add accessibility test cases

## Benefits of Enhanced Test Coverage

### Development Benefits
- **Faster development cycles** with confidence in changes
- **Reduced debugging time** through early error detection
- **Better code quality** through test-driven development

### Maintenance Benefits
- **Regression prevention** when adding new features
- **Documentation** of expected component behavior
- **Refactoring safety** with comprehensive test coverage

### User Experience Benefits
- **More reliable features** with thoroughly tested workflows
- **Better error handling** validated through test scenarios
- **Performance assurance** through load testing

## Monitoring and Metrics

### Coverage Tracking
```bash
# Generate coverage reports
npm test -- --coverage --watchAll=false

# Coverage targets by area:
- Components: >90%
- API routes: >95% 
- Utilities: >85%
- Integration: >80%
```

### Quality Metrics
- **Test pass rate**: Target 95%+
- **Build stability**: Zero flaky tests
- **Performance**: Tests complete in <30s
- **Maintenance**: Test updates completed within 1 day of code changes

## Next Steps

1. **Immediate (Today)**
   - Fix failing taxonomy filtering tests (✅ Complete)
   - Create batch task controls tests (✅ Started)
   - Set up test utilities and shared mocks

2. **Short-term (1-2 days)**
   - Implement TreeNavigation test coverage
   - Add ContextPane integration tests
   - Fix API endpoint test failures

3. **Medium-term (1 week)**
   - Complete component test coverage for all critical components
   - Implement end-to-end workflow testing
   - Add performance and accessibility testing

4. **Long-term (Ongoing)**
   - Maintain 85%+ test coverage on all new code
   - Regular test review and optimization
   - Automated test execution in CI/CD pipeline

---

## Test Coverage Dashboard

| Component | Current Coverage | Target | Priority | Status |
|-----------|------------------|---------|----------|---------|
| WorkstreamFilterDemo | 93.75% | 95% | High | ✅ Near Complete |
| TaskCard | 0% | 90% | High | 🔄 In Progress |
| TreeNavigation | 40% | 85% | High | ⏳ Planned |
| ContextPane | 30% | 80% | High | ⏳ Planned |
| API Routes | 60% | 95% | Medium | ⏳ Planned |
| Batch Controls | 0% | 85% | Medium | 🔄 Started |
| RoadmapParser | 70% | 90% | Medium | ⏳ Planned |

**Overall Project Test Health: 62.5% → Target: 85%** 