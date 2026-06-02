#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup-file.db>"
  exit 1
fi
cp "$1" prisma/data.db
echo "Restored from: $1"
