import shutil
from pathlib import Path

# Define the organization structure
ORGANIZATION = {
    'memory': [
        'loop_memory_reader.py',
        'loop_memory_reader_status.py',
        'vector_memory.py',
        'update_qdrant_embeddings.py',
        'purge_workstream_vectors.py',
        'embed_workstream_files.py',
        'verify_qdrant_persistence.py',
        'check_qdrant_storage_size.py',
        'validate_qdrant_persistence.py',
        'restore_qdrant_data.py',
    ],
    'ingestion': [
        'classify_structured_email_tasks.py',
        'classify_structured_email_tasks_with_reasoning.py',
        'classify_structured_email_tasks_with_reasoning_and_context.py',
        'classify_email_tasks_to_loop.py',
        'verify_gmail_sync.py',
        'reset_gmail_ingest_cache.py',
        'gmail_ingest_fixed.py',
        'gmail_ingest_patch.py',
        'archive_checked_emails.py',
        'run_gmail_archival_test.py',
    ],
    'interface': [
        'streamlit_app_safe.py',
        'streamlit_app_fixed.py',
        'streamlit_app_with_chat.py',
        'streamlit_app.py',
        'generate_cursor_dashboard.py',
        'generate_loop_dashboard.py',
        'generate_loop_impact_dashboard.py',
        'loop_audit_dashboard.py',
    ],
    'tasks': [
        'route_tasks_to_programs_and_projects.py',
        'weight_loops.py',
        'promote_loops.py',
        'promote_loop.py',
        'cleanup_archived_tasks.py',
        'task_signal_router.py',
        'feedback_trace_router.py',
    ],
    'utils': [
        'config.py',
        'generate_token.py',
        'fswatch_log_handler.py',
        'watch_and_log.py',
        'rotate_system_log.py',
        'vision_context_loader.py',
        'gpt_client.py',
        'vault_state.py',
        'vault_reader_basic.py',
        'vault_parser.py',
        'scan_vault_structure.py',
    ],
    'gpt_supervised': [
        'chat_with_gpt.py',
        'classify_loop_gpt.py',
        'classify_loop_gpt_openai_v1.py',
        'load_loops_for_prompt.py',
        'test_chat_with_loop_memory.py',
        'openai_test.py',
    ],
    'graph': [
        'build_dependency_graph.py',
        'query_dependency_graph.py',
        'summarize_dependency_graph.py',
        'enhance_connectivity.py',
    ],
    'yaml': [
        'auto_fix_frontmatter.py',
        'fix_frontmatter.py',
        'validate_frontmatter.py',
        'fix_yaml_errors.py',
        'normalize_yaml_metadata.py',
        'audit_yaml.py',
        'dump_yaml_lines.py',
        'force_yaml_overwrite.py',
        'fix_final_tags.py',
        'fix_source_fields.py',
        'fix_email_yaml.py',
        'fix_created_at_field.py',
        'dump_raw_yaml_blocks.py',
        'fix_tags_in_retrospectives.py',
        'fix_loop_file_1.py',
        'extract_yaml_debug.py',
        'autofix_yaml_retrospectives.py',
        'find_yaml_errors.py',
    ],
    'loops': [
        'loop_summary_patch.py',
        'query_loops.py',
        'write_loop_file.py',
        'validate_loop.py',
        'update_loop_file.py',
        'generate_loop_status.py',
        'generate_loop_from_email.py',
        'generate_loop_from_email_step1.py',
        'generate_loop_from_email_step2.py',
    ],
    'feedback': [
        'process_feedback_tags.py',
        'feedback.py',
        'feedback_patched.py',
        'log_feedback_tags.py',
        'generate_feedback_report.py',
    ],
    'daily': [
        'log_daily_summary.py',
        'daily_refresh.py',
        'daily_context_builder.py',
        'run_daily_note.py',
        'generate_assistant_daily_note.py',
    ],
    'tests': [
        'test_classify_utils.py',
        'test_loop_weights.py',
        'test_project_goals_output.py',
        'test_task_trace_logging.py',
        'run_tests.py',
        'run_with_test.py',
    ]
}

def organize_files():
    base_dir = Path(__file__).parent
    
    # Create directories if they don't exist
    for dir_name in ORGANIZATION.keys():
        (base_dir / dir_name).mkdir(exist_ok=True)
    
    # Move files to their respective directories
    for dir_name, files in ORGANIZATION.items():
        for file_name in files:
            source = base_dir / file_name
            if source.exists():
                target = base_dir / dir_name / file_name
                print(f"Moving {file_name} to {dir_name}/")
                shutil.move(str(source), str(target))

if __name__ == "__main__":
    organize_files() 