#!/bin/bash
echo "🔍 Checking Ora startup before deploy..."
python3 scripts/startup_check.py
if [ $? -ne 0 ]; then
  echo "❌ Deploy aborted: Ora UI failed to load."
  exit 1
else
  echo "✅ Ora passed startup check. Ready to deploy."
fi 