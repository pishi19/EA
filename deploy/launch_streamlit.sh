#!/bin/bash
export OPENAI_API_KEY="sk-your-openai-key-here"
export PYTHONPATH=/root/ea_cursor_system_coupled
streamlit run /root/ea_cursor_system_coupled/src/interface/ora_ui.py --server.port 8501 --server.headless true
