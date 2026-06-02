#!/bin/bash
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
cp prisma/data.db "$BACKUP_DIR/data_$TIMESTAMP.db"
echo "Backup created: $BACKUP_DIR/data_$TIMESTAMP.db"
