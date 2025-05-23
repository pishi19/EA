
from pathlib import Path

import frontmatter

paths = [
    "/Users/air/AIR01/02 Workstreams/Programs",
    "/Users/air/AIR01/02 Workstreams/Projects",
    "/Users/air/AIR01/Retrospectives",
]

for path in paths:
    for file in Path(path).glob("*.md"):
        try:
            frontmatter.load(file)
        except Exception as e:
            print(f"❌ Error in: {file}\n{e}\n")
