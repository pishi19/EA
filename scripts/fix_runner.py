#!/usr/bin/env python3

import os
import re
import subprocess

from openai import OpenAI


def send_fix_prompt(file_path, error_output):
    prompt_path = os.path.expanduser("~/.cursor/prompts/fix-loop-test.md")
    with open(prompt_path) as f:
        prompt = f.read()

    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.2,
        messages=[
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": f"Test failure in {file_path}:\n\n{error_output}",
            },
        ],
    )
    reply = response.choices[0].message.content
    print("\n--- GPT-4o Suggested Fix ---\n")
    print(reply)

print("🔧 Running system integrity tests...")

env = os.environ.copy()
env["PYTHONPATH"] = "."

result = subprocess.run(
    [
        "pytest",
        "-v",
        "tests/test_system_integrity.py",
        "--tb=short",
        "--disable-warnings",
    ],
    capture_output=True,
    text=True,
    env=env,
)

print(result.stdout)

if result.returncode != 0:
    print("❌ Some tests failed.")

    # Parse pytest output for failures
    # Example failure block (short traceback):
    # FAILED tests/test_system_integrity.py::test_vault_index_generation - AssertionError: ...
    # or
    # _______ test_vault_index_generation _______
    # ...
    # E   AssertionError: ...
    # ...
    # tests/test_system_integrity.py:10: AssertionError

    # We'll look for lines like:
    # '________ test_name ________'
    # and collect until the next '________' or end of output
    lines = result.stdout.splitlines()
    failure_blocks = []
    current_block = []
    in_failure = False
    for line in lines:
        if re.match(r"^_{5,} ", line):
            if current_block:
                failure_blocks.append(current_block)
                current_block = []
            in_failure = True
            current_block.append(line)
        elif in_failure:
            if re.match(r"^={5,}", line):  # pytest summary separator
                break
            if re.match(r"^_{5,} ", line):
                # Shouldn't happen, but just in case
                if current_block:
                    failure_blocks.append(current_block)
                    current_block = []
                current_block.append(line)
            else:
                current_block.append(line)
    if current_block:
        failure_blocks.append(current_block)

    # If no blocks found, fallback to summary lines
    if not failure_blocks:
        # Look for lines starting with 'FAILED '
        for line in lines:
            if line.startswith("FAILED "):
                failure_blocks.append([line])

    # For each failure, try to extract file path and error output
    for block in failure_blocks:
        block_text = "\n".join(block)
        # Try to extract file path from the last line with a file:line pattern
        file_path = None
        for l in reversed(block):
            m = re.search(r"([\w./\\-]+\.py):(\d+):", l)
            if m:
                file_path = m.group(1)
                break
        if not file_path:
            # Try to extract from summary line
            for l in block:
                m = re.search(r"FAILED ([\w./\\-]+\.py)", l)
                if m:
                    file_path = m.group(1)
                    break
        if not file_path:
            file_path = "<unknown>"
        print(f"\n=== GPT SUGGESTION FOR {file_path} ===\n")
        send_fix_prompt(file_path, block_text)
else:
    print("✅ All tests passed.")

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "test-fix-prompt":
        sample_error = (
            "AssertionError: Expected True but got False\n"
            'File "src/example.py", line 42, in test_example'
        )
        send_fix_prompt("src/example.py", sample_error)
    else:
        from watchfiles import watch

        print("🔁 Watching for file changes in src/ and tests/…")
        watched_dirs = ["src", "tests"]
        for _ in watch(
            *watched_dirs, watch_filter=lambda change, path: path.endswith(".py")
        ):
            print("\n🔄 Change detected. Re-running tests...\n")
            env = os.environ.copy()
            env["PYTHONPATH"] = "."
            result = subprocess.run(
                [
                    "pytest",
                    "-v",
                    "tests/test_system_integrity.py",
                    "--tb=short",
                    "--disable-warnings",
                ],
                capture_output=True,
                text=True,
                env=env,
            )
            print(result.stdout)
            if result.returncode != 0:
                print("❌ Some tests failed.")

                import re

                lines = result.stdout.splitlines()
                failure_blocks = []
                current_block = []
                in_failure = False
                for line in lines:
                    if re.match(r"^_{5,} ", line):
                        if current_block:
                            failure_blocks.append(current_block)
                            current_block = []
                        in_failure = True
                        current_block.append(line)
                    elif in_failure:
                        if re.match(r"^={5,}", line):  # pytest summary separator
                            break
                        if re.match(r"^_{5,} ", line):
                            if current_block:
                                failure_blocks.append(current_block)
                                current_block = []
                            current_block.append(line)
                        else:
                            current_block.append(line)
                if current_block:
                    failure_blocks.append(current_block)

                if not failure_blocks:
                    for line in lines:
                        if line.startswith("FAILED "):
                            failure_blocks.append([line])

                for block in failure_blocks:
                    block_text = "\n".join(block)
                    file_path = None
                    for l in reversed(block):
                        m = re.search(r"([\w./\\-]+\.py):(\d+):", l)
                        if m:
                            file_path = m.group(1)
                            break
                    if not file_path:
                        for l in block:
                            m = re.search(r"FAILED ([\w./\\-]+\.py)", l)
                            if m:
                                file_path = m.group(1)
                                break
                    if not file_path:
                        file_path = "<unknown>"
                    print(f"\n=== GPT SUGGESTION FOR {file_path} ===\n")
                    send_fix_prompt(file_path, block_text)
            else:
                print("✅ All tests passed.")
