import re
from pathlib import Path

import yaml

REPORT_PATH = Path('skipped_files_report.md')

# Parse the skipped files report to get file paths
def get_problem_files(report_path):
    files = []
    with open(report_path, 'r') as f:
        for line in f:
            match = re.match(r'- \*\*(.*?)\*\*', line)
            if match:
                files.append(match.group(1))
    return files

def extract_frontmatter(content):
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            return parts[1], parts[2]
    return None, None

def try_fix_yaml(frontmatter):
    lines = frontmatter.split('\n')
    fixed_lines = []
    for line in lines:
        # Quote keys with spaces or special chars
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            if not (key.startswith('"') or key.startswith("'")) and (re.search(r'[^a-zA-Z0-9_]', key)):
                key = f'"{key}"'
            fixed_lines.append(f'{key}:{value}')
        else:
            fixed_lines.append(line)
    fixed = '\n'.join(fixed_lines)
    # Try to fix broken lists: add commas between list items if missing
    fixed = re.sub(r'\]\s*\[', '],\n[', fixed)
    return fixed

def validate_yaml(frontmatter):
    try:
        yaml.safe_load(frontmatter)
        return True
    except Exception:
        return False

def comment_out_broken_lines(frontmatter):
    lines = frontmatter.split('\n')
    commented = []
    for line in lines:
        try:
            yaml.safe_load(line)
            commented.append(line)
        except Exception:
            commented.append(f'# {line}')
    return '\n'.join(commented)

def process_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    fm, rest = extract_frontmatter(content)
    if fm is None:
        return False
    fixed_fm = try_fix_yaml(fm)
    if validate_yaml(fixed_fm):
        new_content = f'---\n{fixed_fm}\n---{rest}'
        with open(file_path, 'w') as f:
            f.write(new_content)
        return True
    # If still broken, comment out broken lines
    commented_fm = comment_out_broken_lines(fm)
    if validate_yaml(commented_fm):
        new_content = f'---\n{commented_fm}\n---{rest}'
        with open(file_path, 'w') as f:
            f.write(new_content)
        return True
    return False

def main():
    files = get_problem_files(REPORT_PATH)
    unfixed = []
    for file_path in files:
        try:
            fixed = process_file(file_path)
            print(f'{"✅" if fixed else "❌"} {file_path}')
            if not fixed:
                unfixed.append(file_path)
        except Exception as e:
            print(f'❌ {file_path} | {e}')
            unfixed.append(file_path)
    # Write new report
    if unfixed:
        with open('still_skipped_files.md', 'w') as f:
            f.write('# Still Skipped Files\n\n')
            for file in unfixed:
                f.write(f'- {file}\n')
    print(f'\nDone. {len(unfixed)} files could not be auto-fixed.')

if __name__ == '__main__':
    main() 