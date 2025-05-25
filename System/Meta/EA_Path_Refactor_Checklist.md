
# 🔧 Path Refactor Checklist

Track files that contain hardcoded references to `/Users/air/ea_assistant`. Each should be updated to use `resolve(...)` or constants from `path_config.py`.

## ✅ Replace with `resolve(...)` or predefined constants

- [ ] src/run_messageid_to_threadid_test.py
- [ ] src/auth_gmail_token.py
- [ ] src/insert_loop_to_sqlite.py
- [ ] src/insert_to_sqlite.py
- [ ] src/run_rfc822msgid_to_archive.py
- [ ] src/check_token_scopes.py
- [ ] src/ingestion/run_gmail_archival_test.py
- [ ] src/ingestion/verify_gmail_sync.py
- [ ] src/ingestion/gmail_ingest_patch.py
- [ ] src/ingestion/archive_checked_emails.py
- [ ] src/ingestion/gmail_ingest_fixed.py
- [ ] src/memory/vector_memory.py
- [ ] src/memory/loop_memory_reader.py
- [ ] src/memory/loop_memory_reader_status.py
- [ ] src/memory/update_qdrant_embeddings.py
- [ ] src/graph/build_dependency_graph.py
- [ ] src/tests/test_loop_weights.py
- [ ] src/utils/generate_token.py
- [ ] src/utils/watch_and_log.py
- [ ] src/daily/daily_refresh.py
- [ ] src/feedback/feedback.py
- [ ] src/feedback/feedback_patched.py
- [ ] src/loops/validate_loop.py
- [ ] src/loops/generate_loop_status.py
- [ ] src/loops/query_loops.py
- [ ] src/gpt_supervised/apply_logic_patch.py
- [ ] src/gpt_supervised/load_loops_for_prompt.py
- [ ] src/mcp_server/interface/extract_loops_from_note.py
- [ ] src/mcp_server/interface/add_loop_and_sync.py
- [ ] src/mcp_server/interface/mcp_memory_context.py
- [ ] src/mcp_server/interface/import_loops_to_db.py
- [ ] src/mcp_server/interface/write_loops_to_files.py
- [ ] src/mcp_server/interface/sync_loops_to_markdown.py
- [ ] src/gmail/gmail_auth.py
