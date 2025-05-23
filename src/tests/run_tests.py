import subprocess
import sys


def run_all_tests():
    print("🔍 Running full test suite with coverage...")
    cmd = ["uv", "run", "pytest", "--cov=..", "--cov-report=term-missing", "tests/"]
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    try:
        run_all_tests()
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)
