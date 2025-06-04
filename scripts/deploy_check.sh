#!/bin/bash
source .venv/bin/activate
echo "🔍 Running pytest..."
pytest tests/ || { echo "❌ Tests failed"; exit 1; }
echo "📦 Running bootstrap test..."
python3 bootstrap_test.py || { echo "❌ Bootstrap test failed"; exit 1; }
echo "✅ Deployment checks passed."
