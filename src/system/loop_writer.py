# ✍️ Loop Writer – Save Updated Markdown

import subprocess

import frontmatter


def save_loop_file(path, new_content, new_metadata):
    post = frontmatter.loads(new_content)
    post.metadata.update(new_metadata)
    with open(path, 'w') as f:
        f.write(frontmatter.dumps(post))

    # Add call to update Qdrant embeddings
    try:
        # Ensure the path to the script is correct relative to the execution context of loop_writer.py
        # Assuming loop_writer.py and update_qdrant_embeddings.py are called from the project root
        # or PYTHONPATH is set up appropriately.
        # For robustness, construct absolute path or use a more reliable way to locate the script.
        script_path = "src/memory/update_qdrant_embeddings.py"
        result = subprocess.run(["python", script_path, path], capture_output=True, text=True, check=True)
        print(f"Qdrant embedding call for {path} successful:")
        print(result.stdout)
        if result.stderr:
            print(f"Qdrant embedding call for {path} errors:")
            print(result.stderr)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error calling Qdrant embedding script for {path}:")
        print(f"Return code: {e.returncode}")
        print(f"Output: {e.output}")
        print(f"Stderr: {e.stderr}")
    except FileNotFoundError:
        print(f"❌ Error: The embedding script at {script_path} was not found.")
    except Exception as e:
        print(f"❌ An unexpected error occurred while trying to call Qdrant embedding script for {path}: {e}")

    return True
