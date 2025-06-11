# Test info

- Name: Phase Doc View Page >> should handle accessibility keyboard navigation
- Location: /Users/air/Projects/ora-system/src/ui/react-app/e2e/phase-doc-view.spec.ts:95:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator(':focus')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator(':focus')

    at /Users/air/Projects/ora-system/src/ui/react-app/e2e/phase-doc-view.spec.ts:103:34
```

# Page snapshot

```yaml
- banner:
  - navigation:
    - link "Ora System":
      - /url: /
    - link "Task Executor":
      - /url: /task-executor
    - link "System View":
      - /url: /system-view
    - link "Semantic Chat":
      - /url: /contextual-chat-demo
    - link "Contextual Chat Architecture":
      - /url: /semantic-chat-classic
    - link "Workstream Filter Demo":
      - /url: /workstream-filter-demo
    - link "System Docs":
      - /url: /system-docs
    - link "Phase Document":
      - /url: /phase-doc
    - link "Task Board":
      - /url: /planning
- main:
  - 'heading "Phase 8.2 – Yellow Slice: Contextual Execution" [level=1]'
  - text: in_progress Phase 8.2 Phase
  - combobox "Select phase": "Phase 8.2: Phase 8.2 – Yellow Slice: Contextual Execution"
  - text: Status
  - combobox "Filter by status": All Statuses
  - text: Type
  - combobox "Filter by type": All Types
  - text: Workstream
  - combobox "Filter by workstream": All Workstreams
  - text: Tags
  - combobox "Filter by tags": All Tags
  - text: Sort By
  - combobox "Sort loops by": Newest First
  - main:
    - heading "Phase Documentation" [level=2]
    - heading "✅ Completed Loops" [level=2]
    - list:
      - listitem:
        - checkbox [checked] [disabled]
        - code: loop-2025-08-06-yellow-slice-initiation.md
        - text: ": Scope, structure, and context filters defined"
      - listitem:
        - checkbox [checked] [disabled]
        - code: loop-2025-08-07-testing-framework-recovery.md
        - text: ": Test framework reinstalled and snapshot coverage restored"
      - listitem:
        - checkbox [checked] [disabled]
        - code: loop-2025-08-08-test-infrastructure-diagnosis.md
        - text: ": Analyzed Jest/Radix compatibility issues"
      - listitem:
        - checkbox [disabled]
        - code: loop-2025-08-09-radix-testing-compat.md
        - text: ": Radix JSDOM issues deferred to Phase 9"
    - heading "🔧 In-Progress Objectives" [level=2]
    - list:
      - listitem: Task mutation from UI to markdown
      - listitem: Memory trace scaffolding
      - listitem: Live semantic reasoning across loops
    - heading "🧾 Phase Update – 2025-06-07" [level=2]
    - list:
      - listitem: Full test coverage achieved for TaskExecutor.tsx except for Radix UI dropdown (filter).
      - listitem:
        - text: Test framework reinstated and functioning (see
        - code: loop-2025-08-07-testing-framework-recovery.md
        - text: ).
      - listitem:
        - text: Radix + JSDOM compatibility issue isolated and deferred to Phase 9 (see
        - code: loop-2025-08-09-radix-testing-compat.md
        - text: ).
      - listitem: All testable components now covered; Ora is execution-complete for Phase 8.2 goals except for deferred test issue.
    - heading "Loops in this Phase" [level=2]
    - paragraph: No loops found for this phase.
- button:
  - img
- alert
```

# Test source

```ts
   3 | test.describe('Phase Doc View Page', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     await page.goto('/phase-doc');
   6 |   });
   7 |
   8 |   test('should load phase document page', async ({ page }) => {
   9 |     // Wait for the page to load
   10 |     await expect(page.locator('h1')).toBeVisible();
   11 |     await expect(page.getByText('Phase')).toBeVisible();
   12 |   });
   13 |
   14 |   test('should display phase selection and filtering controls', async ({ page }) => {
   15 |     // Wait for phase selector to load
   16 |     await expect(page.getByRole('combobox', { name: /select phase/i })).toBeVisible();
   17 |     
   18 |     // Check that all filter controls are present
   19 |     await expect(page.getByRole('combobox', { name: /filter by status/i })).toBeVisible();
   20 |     await expect(page.getByRole('combobox', { name: /filter by type/i })).toBeVisible();
   21 |     await expect(page.getByRole('combobox', { name: /filter by workstream/i })).toBeVisible();
   22 |     await expect(page.getByRole('combobox', { name: /filter by tags/i })).toBeVisible();
   23 |     await expect(page.getByRole('combobox', { name: /sort loops by/i })).toBeVisible();
   24 |   });
   25 |
   26 |   test('should filter loops by type', async ({ page }) => {
   27 |     // Wait for content to load
   28 |     await page.waitForLoadState('networkidle');
   29 |     
   30 |     // Click type filter
   31 |     await page.getByRole('combobox', { name: /filter by type/i }).click();
   32 |     
   33 |     // Select execution type
   34 |     const executionOption = page.getByText('⚙️ Execution');
   35 |     if (await executionOption.isVisible()) {
   36 |       await executionOption.click();
   37 |       
   38 |       // Wait for filtering to apply
   39 |       await page.waitForTimeout(500);
   40 |     }
   41 |   });
   42 |
   43 |   test('should expand and collapse loop content', async ({ page }) => {
   44 |     // Wait for loops to load
   45 |     await page.waitForLoadState('networkidle');
   46 |     
   47 |     // Find accordion buttons for loops
   48 |     const accordionButtons = page.locator('[role="button"][aria-expanded]');
   49 |     const firstAccordion = accordionButtons.first();
   50 |     
   51 |     if (await firstAccordion.isVisible()) {
   52 |       // Check initial state (should be collapsed)
   53 |       await expect(firstAccordion).toHaveAttribute('aria-expanded', 'false');
   54 |       
   55 |       // Click to expand
   56 |       await firstAccordion.click();
   57 |       
   58 |       // Wait for expansion
   59 |       await page.waitForTimeout(300);
   60 |       
   61 |       // Should now be expanded
   62 |       await expect(firstAccordion).toHaveAttribute('aria-expanded', 'true');
   63 |     }
   64 |   });
   65 |
   66 |   test('should display phase navigation', async ({ page }) => {
   67 |     // Wait for phase navigation to load
   68 |     await expect(page.getByRole('combobox', { name: /select phase/i })).toBeVisible();
   69 |     
   70 |     // Click phase selector
   71 |     await page.getByRole('combobox', { name: /select phase/i }).click();
   72 |     
   73 |     // Should show available phases
   74 |     const phaseOptions = page.locator('[role="option"]');
   75 |     await expect(phaseOptions.first()).toBeVisible();
   76 |   });
   77 |
   78 |   test('should sort loops correctly', async ({ page }) => {
   79 |     // Wait for content to load
   80 |     await page.waitForLoadState('networkidle');
   81 |     
   82 |     // Click sort selector
   83 |     await page.getByRole('combobox', { name: /sort loops by/i }).click();
   84 |     
   85 |     // Select score sorting
   86 |     const scoreSortOption = page.getByText('Score (High to Low)');
   87 |     if (await scoreSortOption.isVisible()) {
   88 |       await scoreSortOption.click();
   89 |       
   90 |       // Wait for sorting to apply
   91 |       await page.waitForTimeout(500);
   92 |     }
   93 |   });
   94 |
   95 |   test('should handle accessibility keyboard navigation', async ({ page }) => {
   96 |     // Test tab navigation through controls
   97 |     await page.keyboard.press('Tab');
   98 |     await page.keyboard.press('Tab');
   99 |     await page.keyboard.press('Tab');
  100 |     
  101 |     // Should be able to navigate to filter controls
  102 |     const focusedElement = page.locator(':focus');
> 103 |     await expect(focusedElement).toBeVisible();
      |                                  ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  104 |   });
  105 | }); 
```