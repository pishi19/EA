from pathlib import Path
import yaml
import uuid
import sys

loop_dir = Path("runtime/loops")

def main():
    print(f"Scanning directory: {loop_dir.resolve()}")
    if not loop_dir.is_dir():
        print(f"❌ Error: Directory not found: {loop_dir.resolve()}")
        sys.exit(1)

    file_count = 0
    updated_count = 0
    skipped_no_fm = 0
    skipped_invalid_fm = 0

    for file in loop_dir.glob("*.md"):
        if not file.is_file():
            continue
        
        file_count += 1
        print(f"---\nProcessing: {file.name}")
        
        try:
            text = file.read_text(encoding='utf-8')
            
            if not text.startswith("---"):
                print(f"⚠️ Skipping {file.name} (no YAML frontmatter start delimiter '---')")
                skipped_no_fm += 1
                continue

            # Find the end of the frontmatter
            # Correctly find the *second* '---'
            try:
                # Find the first newline after the initial '---'
                first_marker_end = text.find('\n', 3)
                if first_marker_end == -1: # Should not happen if starts with ---
                    print(f"⚠️ Skipping {file.name} (malformed initial frontmatter delimiter)")
                    skipped_invalid_fm += 1
                    continue
                
                # Search for the closing '---' from that point onwards
                fm_end_yaml_marker = text.find("\n---", first_marker_end) 
                if fm_end_yaml_marker == -1:
                    print(f"⚠️ Skipping {file.name} (no closing '---' for frontmatter after initial delimiter)")
                    skipped_invalid_fm += 1
                    continue
                
                fm_text = text[3:fm_end_yaml_marker] # Extract only the YAML content
                body_text = text[fm_end_yaml_marker + len("\n---"):] # Get text after the closing delimiter

            except ValueError as ve:
                print(f"⚠️ Skipping {file.name} (error parsing frontmatter structure: {ve})")
                skipped_invalid_fm += 1
                continue

            frontmatter_data = yaml.safe_load(fm_text)
            if not isinstance(frontmatter_data, dict):
                print(f"⚠️ Frontmatter for {file.name} is not a dictionary. Initializing as empty.")
                frontmatter_data = {}

            id_needs_update = False
            current_id = frontmatter_data.get("id")

            if current_id is None or not isinstance(current_id, str):
                id_needs_update = True
            else:
                try:
                    uuid.UUID(current_id) # Check if it's already a valid UUID string
                except ValueError:
                    id_needs_update = True # It's a string, but not a valid UUID
            
            if id_needs_update:
                # Generate a UUIDv5 based on a namespace and the file stem for deterministic IDs
                # Using NAMESPACE_DNS as it's common for name-based UUIDs.
                # Using file.name to include extension for more uniqueness if stems can collide (though unlikely for loops)
                generated_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, file.name)) 
                frontmatter_data["id"] = generated_id
                
                # Ensure correct YAML formatting, especially for multi-line strings if any
                updated_yaml = yaml.safe_dump(frontmatter_data, sort_keys=False, allow_unicode=True, default_flow_style=False)
                
                # Construct the new content
                # Ensure there's a newline after the closing '---' if body_text is not empty or starts with newline
                if body_text and not body_text.startswith('\n') and not body_text.startswith('\r\n'):
                    body_text = '\n' + body_text
                elif not body_text: # If body is empty, ensure a newline is there for some markdown linters
                    body_text = '\n'
                
                updated_content = f"""---
{updated_yaml}---
{body_text}"""
                
                file.write_text(updated_content, encoding='utf-8')
                print(f"✅ Added/Updated UUID for {file.name}: {generated_id}")
                updated_count += 1
            else:
                print(f"✅ Already has valid ID: {file.name} ({frontmatter_data['id']})")
        
        except Exception as e_file:
            print(f"❌ Error processing {file.name}: {type(e_file).__name__} - {e_file}")

    print(f'\n--- Summary ---')
    print(f'Processed {file_count} .md files.')
    print(f'Updated {updated_count} files with new/corrected UUIDs.')
    print(f'Skipped (no YAML frontmatter start): {skipped_no_fm}.')
    print(f'Skipped (invalid/malformed frontmatter structure): {skipped_invalid_fm}.')

if __name__ == "__main__":
    main() 