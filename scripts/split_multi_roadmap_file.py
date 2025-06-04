from pathlib import Path
import re
import frontmatter

roadmap_path = Path("src/Roadmap/R001.md")
output_dir = roadmap_path.parent

with open(roadmap_path, "r", encoding="utf-8") as f:
    raw = f.read()

# Extract all YAML blocks between ---
matches = re.findall(r"---\s*\n(.*?)\n---", raw, re.DOTALL)
print(f"Found {len(matches)} roadmap blocks")

for idx, block in enumerate(matches):
    try:
        post = frontmatter.loads(f"---\n{block}\n---")
        rid = post.get("ID") or post.get("id") or f"R{100+idx}"
        filename = f"{rid}.md"
        cleaned = frontmatter.Post("", **{
            "id": rid,
            "title": post.get("Feature") or post.get("title", "Untitled"),
            "status": post.get("Status", "unknown").capitalize(),
            "instructions": post.get("Instructions", ""),
        })
        out_path = output_dir / filename
        with open(out_path, "wb") as f:
            frontmatter.dump(cleaned, f)
        print(f"✅ Created {filename}")
    except Exception as e:
        print(f"❌ Failed to parse block #{idx+1}: {e}") 