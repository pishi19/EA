import os

skipped_files = [
    "vault/CRM Migration/loop-2025-07-05-integration-testing.md",
    "vault/CRM Migration/loop-2025-07-02-data-migration.md",
    "vault/Partner Growth/loop-2025-07-03-enablement-sessions.md",
    "vault/Retail Expansion/loop-2025-07-01-new-store-launch.md",
    "vault/Retail Expansion/loop-2025-07-04-market-research.md",
]

log_path = "/Users/air/Archives/EA/skipped_loops_log.txt"
log_dir = os.path.dirname(log_path)

# Ensure the directory for the log file exists
if not os.path.exists(log_dir):
    os.makedirs(log_dir)
    print(f"📁 Created directory: {log_dir}")

with open(log_path, "w") as f:
    f.write("🗃️ Skipped Vault Loop Files (not migrated due to missing frontmatter):\n\n")
    for path in skipped_files:
        f.write(f"• {path}\n")

print(f"✅ Log written to {log_path}") 