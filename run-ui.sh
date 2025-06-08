#!/bin/bash
# Script to run the Ora React UI development server

# Navigate to the react-app directory
cd "$(dirname "$0")/src/ui/react-app"

# Start the development server
echo "Starting Next.js development server in $(pwd)..."
npm run dev 