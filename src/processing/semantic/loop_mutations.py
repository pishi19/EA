import logging
import os
from typing import Optional

import yaml

from .reembedding import reembed_loop_by_uuid

LOOP_DIR = "runtime/loops"

def find_loop_file_by_uuid(uuid: str) -> Optional[str]:
    logging.info(f"🔍 Searching for loop with UUID: {uuid}")
    # Ensure LOOP_DIR exists to prevent os.listdir error if it doesn't
    if not os.path.isdir(LOOP_DIR):
        logging.warning(f"⚠️ LOOP_DIR not found or is not a directory: {LOOP_DIR}")
        return None
    for filename in os.listdir(LOOP_DIR):
        if not filename.startswith("loop-") or not filename.endswith(".md"):
            continue
        path = os.path.join(LOOP_DIR, filename)
        try:
            with open(path, encoding="utf-8") as f:
                content = f.read()
            if content.startswith("---"):
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    front = yaml.safe_load(parts[1])
                    if front and isinstance(front, dict):
                        found_uuid = str(front.get("uuid", "")).strip()
                        logging.info(f"🧾 File: {filename} — uuid: '{found_uuid}'")
                        if found_uuid.strip().lower() == uuid.strip().lower():
                            logging.info(f"✅ Match found in {filename}")
                            return path
        except yaml.YAMLError as e:
            logging.error(f"❌ YAML parsing error in {path}: {e}")
        except OSError as e:
            logging.error(f"❌ IO error reading {path}: {e}")
        except Exception as e:
            logging.error(f"❌ Unexpected error processing {path}: {e}")
    logging.warning(f"❌ No loop file found matching the UUID: {uuid}")
    return None

def promote_loop_to_roadmap(uuid: str) -> bool:
    path = find_loop_file_by_uuid(uuid)
    if not path:
        return False
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        logging.error(f"Promote: Error reading file {path}: {e}")
        return False

    parts = content.split("---", 2)
    if len(parts) < 3:
        logging.error(f"Promote: Frontmatter format error in {path}")
        return False

    try:
        front = yaml.safe_load(parts[1])
        if not isinstance(front, dict):
            logging.error(f"Promote: Frontmatter in {path} is not a dict.")
            return False
    except yaml.YAMLError as e:
        logging.error(f"Promote: YAML error in {path}: {e}")
        return False

    if "tags" not in front or not isinstance(front["tags"], list):
        front["tags"] = []

    if "roadmap" not in front["tags"]:
        front["tags"].append("roadmap")
        new_yaml = yaml.dump(front, sort_keys=False, allow_unicode=True)
        with open(path, "w", encoding="utf-8") as f:
            main_content = parts[2].lstrip()
            f.write(f"---\n{new_yaml}---\n{main_content}")

        logging.info(f"Promoted loop {uuid} to roadmap. File updated. Attempting re-embedding.")
        reembed_loop_by_uuid(uuid)
        return True
    else:
        logging.info(f"Loop {uuid} is already on the roadmap. No changes made.")
        return True

def tag_loop_feedback(uuid: str, tag: str) -> bool:
    path = find_loop_file_by_uuid(uuid)
    if not path:
        return False
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        logging.error(f"Tag: Error reading file {path}: {e}")
        return False

    parts = content.split("---", 2)
    if len(parts) < 3:
        logging.error(f"Tag: Frontmatter format error in {path}")
        return False

    try:
        front = yaml.safe_load(parts[1])
        if not isinstance(front, dict):
            logging.error(f"Tag: Frontmatter in {path} is not a dict.")
            return False
    except yaml.YAMLError as e:
        logging.error(f"Tag: YAML error in {path}: {e}")
        return False

    if "tags" not in front or not isinstance(front["tags"], list):
        front["tags"] = []

    if tag not in front["tags"]:
        front["tags"].append(tag)
        new_yaml = yaml.dump(front, sort_keys=False, allow_unicode=True)
        with open(path, "w", encoding="utf-8") as f:
            main_content = parts[2].lstrip()
            f.write(f"---\n{new_yaml}---\n{main_content}")

        logging.info(f"Added tag '{tag}' to loop {uuid}. File updated. Attempting re-embedding.")
        reembed_loop_by_uuid(uuid)
        return True
    else:
        logging.info(f"Tag '{tag}' already present for UUID {uuid}. No changes made.")
        return True
