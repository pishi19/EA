#!/bin/bash

echo "👀 Watching for changes in src/ and tests/..."

fswatch -o src/ tests/ | while read num; do
  echo "🔁 Change detected – running tests..."
  echo "----------------------------------------"
  python3 scripts/fix_runner.py
  echo "========================================"
  echo "⏳ Waiting for next change..."
  sleep 1
done
