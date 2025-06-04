#!/bin/bash

echo "🔍 Searching for Python files using Streamlit..."
echo ""

find . -name "*.py" -type f \
  -exec grep -H -E "import streamlit|st\\." {} \; \
  | sed 's/:/\n→ /' \
  | tee streamlit_ui_report.txt

echo ""
echo "✅ Done. Output saved to streamlit_ui_report.txt" 