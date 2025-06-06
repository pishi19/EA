from pathlib import Path

import frontmatter


def debug_scan_files():
    print("🔍 Scanning Retrospectives/*.md")
    retro_files = list(Path("Retrospectives").glob("*.md"))
    if not retro_files:
        print("⚠️ No retrospective files found.")
    for f in retro_files:
        print(f"Found: {f}")
        try:
            post = frontmatter.load(f)
            print(f"✅ Parsed: {f.name}")
            print(f"  Keys: {list(post.keys())}")
        except Exception as e:
            print(f"❌ Failed to parse {f.name}: {e}")

    print("\n🔍 Checking ea_roadmap.md")
    if not Path("ea_roadmap.md").exists():
        print("❌ ea_roadmap.md not found")
        return
    try:
        post = frontmatter.load("ea_roadmap.md")
        print("✅ Parsed ea_roadmap.md")
        print(f"  Keys: {list(post.keys())}")
    except Exception as e:
        print(f"❌ Failed to parse ea_roadmap.md: {e}")

if __name__ == "__main__":
    debug_scan_files()
