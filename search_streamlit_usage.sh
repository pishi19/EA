#!/bin/bash
find . -name "*.py" -exec grep -l "streamlit" {} \; 