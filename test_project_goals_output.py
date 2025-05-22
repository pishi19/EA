import json
from pathlib import Path

OUTPUT_PATH = Path("/Users/air/AIR01/System/Data/project_goals.json")

def main():
    if not OUTPUT_PATH.exists():
        print("❌ project_goals.json not found.")
        return
    with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"✅ Loaded {len(data)} project(s) with goals.")
    for project in data:
        print(f"🔹 {project['id']} → {len(project['goals'])} goal(s):")
        for g in project['goals']:
            print(f"   - {g}")

if __name__ == "__main__":
    main()
