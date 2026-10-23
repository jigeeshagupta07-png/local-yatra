#!/usr/bin/env bash
# Quick launch script for YatraLocal
echo "Starting YatraLocal Tourism Web App..."
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi
python3 server.py
