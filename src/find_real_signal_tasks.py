import os


def find_files_with_thread_id(root_dir="/Users/air", filename="Signal_Tasks.md", keyword="threadId:"):
    matches = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for file in filenames:
            if file == filename:
                full_path = os.path.join(dirpath, file)
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        if keyword in content:
                            matches.append(full_path)
                except Exception as e:
                    print(f"Error reading {full_path}: {e}")
    return matches

if __name__ == "__main__":
    print("🔍 Searching for Signal_Tasks.md files containing 'threadId:' ...")
    results = find_files_with_thread_id()
    if results:
        print("✅ Found the following matching file(s):")
        for path in results:
            print(f" - {path}")
    else:
        print("❌ No matching files found.")
