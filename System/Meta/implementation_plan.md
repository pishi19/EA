# 🚧 EA System-Coupled Implementation Plan

## Phase 1: Foundation Setup
- [x] Create structured folder tree for system → loop → session alignment
- [x] Generate example loop, session, and prompt files
- [ ] Add frontmatter to existing `.md` documents

## Phase 2: Automation Scripts
- [ ] session_parser.py: extract context, files, decisions from session exports
- [ ] trace_mapper.py: link session → loop → project
- [ ] obsidian_links_gen.py: write backlinks into .md files

## Phase 3: Operational Workflow
- [ ] Use `cursor-session.sh` to launch sessions
- [ ] Export sessions and process them into logs
- [ ] Keep logs up to date in `system_state_view.md`

## Phase 4: Feedback and Promotion
- [ ] Add feedback tags to loop files
- [ ] Automatically promote completed loops to projects or Done
- [ ] Sync GPT/Cursor logic with system plan

