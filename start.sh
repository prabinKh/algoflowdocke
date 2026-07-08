#!/bin/bash

# Exit immediately if a command fails
set -e

echo "--- Preparing to run AlgoFlow-E ---"

# 1. Dependency Checks
echo "[1/4] Checking dependencies..."

if ! command -v node &> /dev/null; then
  echo "Error: Node.js not found."
  exit 1
fi

if ! command -v python3 &> /dev/null; then
  echo "Error: Python 3 not found."
  exit 1
fi

# 2. Installation
echo "[2/4] Installing dependencies..."
npm install
pip3 install -r backend/requirements.txt

# 3. Building
echo "[3/4] Building application..."
# Note: Ensure the build script in package.json is correct
npm run build:prod

# 4. Execution
echo "[4/4] Starting server..."
npm run start
