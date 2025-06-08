# Loop Resolution Log: loop-2025-09-07-phase-index-fix

**Timestamp:** ${new Date().toISOString()}

## 🧾 Execution Log

- **Issue:** The System View and Phase Doc UI were not rendering all roadmap phases correctly. Only a subset of phases was visible, and Phase 10.0 was missing entirely.
- **Investigation:**
    1. The investigation revealed that the frontend components were using separate, inconsistent API endpoints (`/api/system-view` and `/api/phase-doc`) to fetch phase and loop data.
    2. The logic for discovering and parsing phase files was fragmented and incomplete, causing several phases to be missed.
    3. There was no single source of truth for the system's roadmap, leading to data discrepancies between different views.
- **Resolution:**
    1. Created a new, centralized API endpoint at `/api/roadmap`. This endpoint is now the single source of truth for all phase and loop data.
    2. Implemented a robust data loading strategy in the new API. It first attempts to load from a structured `system_roadmap.yaml` file and falls back to scanning and parsing individual markdown files from the `/runtime/phases` and `/runtime/loops` directories if the YAML file is not present.
    3. Refactored both the `SystemView.tsx` and `PhaseDocView.tsx` components to use the new `/api/roadmap` endpoint.
    4. Updated the UI in both components to correctly render all phases, their associated metadata (including score), and a list of linked loops, ensuring Phase 10.0 and its loops are now visible.
    5. Centralized all shared data types (`Phase`, `Loop`, etc.) into a single `lib/types.ts` file to improve code organization and type safety.
- **Outcome:** The System View and Phase Doc pages now correctly display the complete and accurate system roadmap. The underlying data architecture is more robust, reliable, and easier to maintain. 