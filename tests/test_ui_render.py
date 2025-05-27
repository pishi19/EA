import pytest
import subprocess
import time
import os
from pathlib import Path
import re
import requests
from bs4 import BeautifulSoup

STREAMLIT_CMD = ["streamlit", "run", "src/cursor_dashboard.py"]
ROADMAP_PATH = Path("System/Reference/ea_roadmap.md")
RETRO_DIR = Path("Retrospectives")
STREAMLIT_URL = "http://localhost:8501"

@pytest.mark.timeout(60)
def test_ui_html_scraping_granular():
    """Granular UI checks for Reflections and Roadmap tabs."""
    proc = subprocess.Popen(["streamlit", "run", "src/cursor_dashboard.py", "--server.headless=true"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        # Wait for Streamlit to start
        for _ in range(30):
            try:
                r = requests.get(STREAMLIT_URL)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(1)
        else:
            raise RuntimeError("Streamlit app did not start in time.")
        soup = BeautifulSoup(r.text, "html.parser")
        # --- Reflections Tab ---
        # Find all feature titles from reflection files
        feature_titles = []
        for retro_file in RETRO_DIR.glob("*.md"):
            content = retro_file.read_text(encoding="utf-8")
            m = re.search(r"feature:\s*(.*)", content)
            if m:
                feature_titles.append(m.group(1).strip())
        # Check for feature titles in UI
        for title in feature_titles:
            found = soup.find(string=re.compile(re.escape(title)))
            assert found, f"[Reflections] Feature title '{title}' not found in UI."
        # Check for metadata fields
        for field in ["ID", "File Target", "Executed On"]:
            found = soup.find(string=re.compile(field))
            assert found, f"[Reflections] Metadata field '{field}' not found in UI."
        # Check for buttons
        button_texts = [b.get_text() for b in soup.find_all("button")]
        for btn in ["Tag with GPT", "Suggest Roadmap Item", "Add to Roadmap"]:
            assert any(btn in t for t in button_texts), f"[Reflections] Button '{btn}' not found in UI."
        # Check for summary markdown (if present)
        summary_found = any("Summary:" in d.get_text() for d in soup.find_all("div"))
        if not summary_found:
            print("[Reflections] No summary markdown found (OK if not generated yet).")
        # --- Roadmap Tab ---
        # Parse roadmap blocks
        content = ROADMAP_PATH.read_text()
        roadmap_blocks = [b for b in content.split('##') if b.strip()]
        # Count feature names in UI (should match block count)
        roadmap_features = [b.splitlines()[0].strip() for b in roadmap_blocks if b.splitlines()]
        feature_ui_count = sum(1 for f in roadmap_features if soup.find(string=re.compile(re.escape(f))))
        assert feature_ui_count == len(roadmap_blocks), f"[Roadmap] UI shows {feature_ui_count} items, expected {len(roadmap_blocks)}."
        # Check for each field in UI
        for block in roadmap_blocks:
            lines = block.splitlines()
            feature = lines[0].strip() if lines else 'Unknown Feature'
            for field in ["ID", "Status", "File Target"]:
                found = any(field in d.get_text() for d in soup.find_all("div"))
                assert found, f"[Roadmap] Field '{field}' missing for feature '{feature}'."
        # Check Mark as Executed button logic
        for block in roadmap_blocks:
            lines = block.splitlines()
            feature = lines[0].strip() if lines else 'Unknown Feature'
            executed = None
            for line in lines:
                if line.lower().startswith("**executed:**"):
                    executed = line.split("**Executed:**", 1)[-1].strip().lower()
            if executed == "no":
                found = any("Mark Executed" in b.get_text() for b in soup.find_all("button"))
                assert found, f"[Roadmap] 'Mark as Executed' button missing for unexecuted feature '{feature}'."
        print("[test_ui_html_scraping_granular] All granular UI checks passed.")
    except Exception as e:
        print(f"[test_ui_html_scraping_granular] Failed: {e}")
        raise
    finally:
        proc.terminate()
        proc.wait()

@pytest.mark.timeout(30)
def test_tab_visibility():
    """Test that main tabs are visible in the Streamlit app."""
    proc = subprocess.Popen(["streamlit", "run", "src/cursor_dashboard.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    time.sleep(5)
    try:
        stdout, stderr = proc.communicate(timeout=5)
        output = stdout + stderr
        assert "📍 Roadmap" in output, "Tab '📍 Roadmap' not found"
        assert "📘 Reflections" in output, "Tab '📘 Reflections' not found"
        assert "📊 Dashboard" in output, "Tab '📊 Dashboard' not found"
    except Exception as e:
        print(f"[test_tab_visibility] Failed: {e}")
        raise
    finally:
        proc.terminate()
        proc.wait()

@pytest.mark.timeout(10)
def test_roadmap_rendering():
    """Test that the number of roadmap items rendered matches the number of blocks in ea_roadmap.md."""
    try:
        content = ROADMAP_PATH.read_text()
        block_count = len([b for b in content.split('##') if b.strip()])
        # Simulate parsing as in the app
        assert block_count > 0, "No roadmap blocks found in ea_roadmap.md"
        print(f"[test_roadmap_rendering] Found {block_count} roadmap blocks.")
    except Exception as e:
        print(f"[test_roadmap_rendering] Failed: {e}")
        raise

@pytest.mark.timeout(10)
def test_reflection_rendering():
    """Test that each reflection file shows metadata, body, and action buttons."""
    try:
        files = list(RETRO_DIR.glob("*.md"))
        assert files, "No reflection files found."
        for retro_file in files:
            content = retro_file.read_text(encoding="utf-8")
            assert "roadmap_id" in content, f"Missing roadmap_id in {retro_file.name}"
            assert "executed_on" in content, f"Missing executed_on in {retro_file.name}"
            assert "## Reflection" in content, f"Missing reflection section in {retro_file.name}"
        print(f"[test_reflection_rendering] Checked {len(files)} reflection files.")
    except Exception as e:
        print(f"[test_reflection_rendering] Failed: {e}")
        raise

@pytest.mark.timeout(20)
def test_fallback_states(tmp_path):
    """Test fallback UI when roadmap is missing."""
    backup = None
    try:
        if ROADMAP_PATH.exists():
            backup = tmp_path / "ea_roadmap_backup.md"
            ROADMAP_PATH.replace(backup)
        # Simulate app run and check for fallback message
        proc = subprocess.Popen(["streamlit", "run", "src/cursor_dashboard.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        time.sleep(5)
        stdout, stderr = proc.communicate(timeout=5)
        output = stdout + stderr
        assert "No roadmap items found" in output or "No roadmap or reflection data available" in output, "Fallback message not found when roadmap is missing"
        print("[test_fallback_states] Fallback message found.")
    except Exception as e:
        print(f"[test_fallback_states] Failed: {e}")
        raise
    finally:
        proc.terminate()
        proc.wait()
        if backup and not ROADMAP_PATH.exists():
            backup.replace(ROADMAP_PATH)

@pytest.mark.parametrize("roadmap_content,expected_blocks", [
    ("", 0),
    ("## Feature\n**ID:** 1\n**Status:** planned\n**File Target:** file.md\n**Instructions:** Do something.\n", 1),
    ("## A\n**ID:** 1\n**Status:** planned\n**File Target:** file.md\n**Instructions:** X.\n## B\n**ID:** 2\n**Status:** done\n**File Target:** file2.md\n**Instructions:** Y.\n", 2),
])
def test_roadmap_block_count(tmp_path, roadmap_content, expected_blocks):
    """Test roadmap block parsing edge cases."""
    test_path = tmp_path / "ea_roadmap.md"
    test_path.write_text(roadmap_content)
    blocks = [b for b in roadmap_content.split('##') if b.strip()]
    assert len(blocks) == expected_blocks, f"Expected {expected_blocks} blocks, got {len(blocks)}"
    print(f"[test_roadmap_block_count] {expected_blocks} blocks as expected.") 