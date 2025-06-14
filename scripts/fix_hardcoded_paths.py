#!/usr/bin/env python3
"""
Script to identify and help fix hardcoded paths in the Ora System codebase.
This addresses the security concern of exposed personal directory paths.
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple

def find_hardcoded_paths(root_dir: Path) -> List[Tuple[Path, int, str]]:
    """Find all hardcoded /Users/air paths in Python files."""
    hardcoded_paths = []
    pattern = re.compile(r'/Users/air/[^"\']*')
    
    # Extensions to check
    extensions = {'.py', '.md', '.yaml', '.yml', '.json', '.sh'}
    
    for file_path in root_dir.rglob('*'):
        if (file_path.is_file() and file_path.suffix in extensions and 
            not any(skip in str(file_path) for skip in ['.git', '__pycache__', '.venv', 'node_modules'])):
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    for line_num, line in enumerate(f, 1):
                        matches = pattern.findall(line)
                        for match in matches:
                            hardcoded_paths.append((file_path, line_num, line.strip()))
            except (UnicodeDecodeError, PermissionError):
                continue
    
    return hardcoded_paths

def suggest_replacements() -> dict:
    """Suggest environment variable replacements for common paths."""
    return {
        '/Users/air/AIR01': '${BASE_VAULT_PATH:-./vault}',
        '/Users/air/AIR01/System/Logs': '${SYSTEM_LOGS_PATH:-./logs}',
        '/Users/air/AIR01/Retrospectives': '${RETROSPECTIVES_PATH:-./vault/retrospectives}',
        '/Users/air/AIR01/MCP/Loops': '${MCP_LOOPS_PATH:-./runtime/loops}',
        '/Users/air/Library/Logs/ora': '${ORA_LOGS_PATH:-./logs}',
    }

def main():
    """Main function to analyze and report hardcoded paths."""
    project_root = Path(__file__).parent.parent
    
    print("🔍 Scanning for hardcoded paths...")
    hardcoded_paths = find_hardcoded_paths(project_root)
    
    if not hardcoded_paths:
        print("✅ No hardcoded paths found!")
        return
    
    print(f"\n⚠️  Found {len(hardcoded_paths)} hardcoded paths in {len(set(p[0] for p in hardcoded_paths))} files:\n")
    
    # Group by file
    files_with_paths = {}
    for file_path, line_num, line_content in hardcoded_paths:
        if file_path not in files_with_paths:
            files_with_paths[file_path] = []
        files_with_paths[file_path].append((line_num, line_content))
    
    # Display results
    for file_path, lines in files_with_paths.items():
        rel_path = file_path.relative_to(project_root)
        print(f"📄 {rel_path}")
        for line_num, line_content in lines[:3]:  # Show first 3 lines
            print(f"   Line {line_num}: {line_content}")
        if len(lines) > 3:
            print(f"   ... and {len(lines) - 3} more lines")
        print()
    
    # Show suggestions
    print("💡 Suggested Environment Variables:")
    suggestions = suggest_replacements()
    for old_path, new_var in suggestions.items():
        print(f"   {old_path} → {new_var}")
    
    print(f"\n📋 Next Steps:")
    print(f"   1. Add the suggested environment variables to your .env file")
    print(f"   2. Update the affected files to use Path(os.getenv('VAR_NAME', 'default'))")
    print(f"   3. Test that LLM functionality still works")
    print(f"   4. Consider creating a centralized path configuration module")
    
    print(f"\n⚠️  Security Note:")
    print(f"   These hardcoded paths reveal personal directory structure.")
    print(f"   Replace them before making the repository public.")

if __name__ == "__main__":
    main() 