#!/usr/bin/env python3
"""
Interaction Logger: Cross-link interaction files to loop memory traces and execution logs.

This script processes all interaction-*.md files and adds summary references
to the corresponding loop files' Memory Trace or Execution Log sections.
"""

import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import yaml


def get_project_root() -> Path:
    """Get the project root directory."""
    current_file = Path(__file__).resolve()
    # Navigate up from src/processing/interaction_logger.py to project root
    return current_file.parents[2]


def parse_interaction_file(filepath: Path) -> Optional[Dict]:
    """Parse a single interaction markdown file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split frontmatter and content
        if content.startswith('---\n'):
            parts = content.split('---\n', 2)
            if len(parts) >= 3:
                frontmatter_str = parts[1]
                body = parts[2]
                
                # Parse frontmatter
                frontmatter = yaml.safe_load(frontmatter_str)
                
                # Extract message and outcome from body
                message_match = re.search(r'## 💬 Message\s*\n(.*?)(?=\n## |$)', body, re.DOTALL)
                outcome_match = re.search(r'## 🔄 Outcome\s*\n(.*?)(?=\n## |$)', body, re.DOTALL)
                
                message = message_match.group(1).strip() if message_match else ""
                outcome = outcome_match.group(1).strip() if outcome_match else ""
                
                # Add parsed content
                frontmatter['message'] = message
                frontmatter['outcome'] = outcome
                frontmatter['filename'] = filepath.name
                
                return frontmatter
    except Exception as e:
        print(f"Error parsing {filepath.name}: {e}")
        return None
    return None


def get_loop_context(interaction: Dict) -> Optional[str]:
    """Extract loop ID from interaction context."""
    context = interaction.get('context', '')
    
    # Check if context directly references a loop
    if context.startswith('loop-'):
        return context
    
    # Check tags for loop references
    tags = interaction.get('tags', [])
    if isinstance(tags, list):
        for tag in tags:
            if isinstance(tag, str) and tag.startswith('loop-'):
                return tag
    
    # Check in message content for loop references
    message = interaction.get('message', '')
    loop_match = re.search(r'loop-([\d-]+[a-zA-Z-]*)', message)
    if loop_match:
        return f"loop-{loop_match.group(1)}"
    
    return None


def determine_section_type(interaction: Dict) -> str:
    """Determine whether interaction should go to Memory Trace or Execution Log."""
    actor = interaction.get('actor', 'unknown')
    source = interaction.get('source', 'unknown')
    
    # User interactions and chat go to Memory Trace
    if actor == 'user' or source == 'chat':
        return 'memory'
    
    # Ora system actions go to Execution Log
    if actor == 'ora' or source in ['api', 'system']:
        return 'execution'
    
    # Default to Memory Trace for UI interactions
    return 'memory'


def create_summary_line(interaction: Dict) -> str:
    """Create a summary line for the loop file."""
    timestamp = interaction.get('timestamp', 'Unknown time')
    actor = interaction.get('actor', 'unknown').upper()
    uuid = interaction.get('uuid', 'no-uuid')
    message = interaction.get('message', 'No message')
    
    # Extract date from timestamp
    try:
        if isinstance(timestamp, str):
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            date_str = dt.strftime('%Y-%m-%d')
        elif isinstance(timestamp, datetime):
            date_str = timestamp.strftime('%Y-%m-%d')
        else:
            date_str = str(timestamp)[:10] if len(str(timestamp)) >= 10 else 'unknown-date'
    except Exception:
        timestamp_str = str(timestamp)
        date_str = timestamp_str[:10] if len(timestamp_str) >= 10 else 'unknown-date'
    
    # Create message summary (first 100 chars)
    message_summary = message.replace('\n', ' ').strip()
    if len(message_summary) > 100:
        message_summary = message_summary[:97] + "..."
    
    # Format the summary line
    if interaction.get('actor') == 'user':
        return f"- {date_str}: 👤 User interaction [{uuid[:8]}]: {message_summary}"
    else:
        return f"- {date_str}: 🤖 Ora action [{uuid[:8]}]: {message_summary}"


def find_loop_file(loop_id: str, loops_dir: Path) -> Optional[Path]:
    """Find the corresponding loop file for a loop ID."""
    loop_file = loops_dir / f"{loop_id}.md"
    if loop_file.exists():
        return loop_file
    
    # Try some variations if exact match doesn't exist
    for file in loops_dir.glob("*.md"):
        if loop_id in file.stem:
            return file
    
    return None


def add_to_loop_section(loop_file: Path, section_type: str, summary_line: str) -> bool:
    """Add summary line to the appropriate section in the loop file."""
    try:
        with open(loop_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Determine section header
        if section_type == 'memory':
            section_header = '## 🧠 Memory Trace'
        else:
            section_header = '## 🧾 Execution Log'
        
        # Check if section exists
        if section_header not in content:
            # Create the section at the end
            content = content.rstrip() + f'\n\n{section_header}\n\n{summary_line}\n'
        else:
            # Find the section and add the line
            lines = content.split('\n')
            new_lines = []
            in_target_section = False
            added = False
            
            for i, line in enumerate(lines):
                new_lines.append(line)
                
                # Check if we're entering the target section
                if line.strip() == section_header:
                    in_target_section = True
                    continue
                
                # Check if we're leaving the target section (next ## header)
                if in_target_section and line.startswith('## ') and line.strip() != section_header:
                    # Add our line before this new section
                    new_lines.insert(-1, summary_line)
                    new_lines.insert(-1, '')
                    added = True
                    in_target_section = False
            
            # If we were still in the target section at the end, add the line
            if in_target_section and not added:
                new_lines.append('')
                new_lines.append(summary_line)
            
            content = '\n'.join(new_lines)
        
        # Write back to file
        with open(loop_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
        
    except Exception as e:
        print(f"Error updating {loop_file}: {e}")
        return False


def process_interactions(project_root: Path, dry_run: bool = False) -> Dict[str, int]:
    """Process all interactions and link them to loop files."""
    interactions_dir = project_root / "runtime" / "interactions"
    loops_dir = project_root / "runtime" / "loops"
    
    if not interactions_dir.exists():
        print(f"❌ Interactions directory not found: {interactions_dir}")
        return {'processed': 0, 'linked': 0, 'errors': 0}
    
    if not loops_dir.exists():
        print(f"❌ Loops directory not found: {loops_dir}")
        return {'processed': 0, 'linked': 0, 'errors': 0}
    
    stats = {'processed': 0, 'linked': 0, 'errors': 0}
    interaction_files = list(interactions_dir.glob("interaction-*.md"))
    
    print(f"📂 Found {len(interaction_files)} interaction files")
    
    for filepath in interaction_files:
        print(f"🔍 Processing {filepath.name}...")
        stats['processed'] += 1
        
        # Parse interaction
        interaction = parse_interaction_file(filepath)
        if not interaction:
            print(f"  ❌ Failed to parse")
            stats['errors'] += 1
            continue
        
        # Get loop context
        loop_id = get_loop_context(interaction)
        if not loop_id:
            print(f"  ⚠️ No loop context found")
            continue
        
        # Find loop file
        loop_file = find_loop_file(loop_id, loops_dir)
        if not loop_file:
            print(f"  ⚠️ Loop file not found for {loop_id}")
            continue
        
        # Determine section type
        section_type = determine_section_type(interaction)
        
        # Create summary line
        summary_line = create_summary_line(interaction)
        
        print(f"  📝 Linking to {loop_file.name} ({section_type} section)")
        print(f"      {summary_line}")
        
        if not dry_run:
            # Add to loop file
            success = add_to_loop_section(loop_file, section_type, summary_line)
            if success:
                stats['linked'] += 1
                print(f"  ✅ Successfully linked")
            else:
                stats['errors'] += 1
                print(f"  ❌ Failed to link")
        else:
            stats['linked'] += 1
            print(f"  ✅ Would link (dry run)")
    
    return stats


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Cross-link interactions to loop memory traces')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    project_root = get_project_root()
    print(f"🚀 Starting interaction linking process...")
    print(f"📁 Project root: {project_root}")
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No files will be modified")
    
    stats = process_interactions(project_root, dry_run=args.dry_run)
    
    print(f"\n📊 Processing Summary:")
    print(f"  Interactions processed: {stats['processed']}")
    print(f"  Successfully linked: {stats['linked']}")
    print(f"  Errors: {stats['errors']}")
    
    if stats['linked'] > 0:
        print(f"✅ Successfully linked {stats['linked']} interactions to loop files")
    
    if stats['errors'] > 0:
        print(f"⚠️ {stats['errors']} errors occurred during processing")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 