#!/bin/bash
# Production TiDB Database Backup and Sync Script
# Purpose: Backup production database and sync to local development

echo "🔄 Starting Production Database Backup & Sync Process..."
echo "=================================================="

# Production Database Credentials (from .env)
PROD_HOST="gateway01.eu-central-1.prod.aws.tidbcloud.com"
PROD_PORT="4000"
PROD_USER="3iv5fPeLo2ze3jn.root"
PROD_PASSWORD="Dj2teUVtQyMYghF3"
PROD_DB="siwa_oasis"

# Local Database Credentials
LOCAL_HOST="127.0.0.1"
LOCAL_PORT="3306"
LOCAL_USER="root"
LOCAL_PASSWORD=""
LOCAL_DB="siwa_oasis"

# Backup directory
BACKUP_DIR="./database_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/siwa_oasis_backup_$TIMESTAMP.sql"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Step 1: Backup Production Database
echo ""
echo "📦 Step 1: Backing up production database from TiDB Cloud..."
mysqldump -h "$PROD_HOST" -P "$PROD_PORT" -u "$PROD_USER" -p"$PROD_PASSWORD" \
  --ssl-mode=REQUIRED \
  --single-transaction \
  --quick \
  "$PROD_DB" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Production backup created: $BACKUP_FILE"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "   Size: $BACKUP_SIZE"
else
    echo "❌ Error backing up production database"
    exit 1
fi

# Step 2: Drop local database (optional - confirm first)
echo ""
echo "⚠️  Step 2: Preparing local database..."
read -p "⚠️  WARNING: This will replace your local database. Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Sync cancelled."
    exit 0
fi

# Drop local database
mysql -h "$LOCAL_HOST" -P "$LOCAL_PORT" -u "$LOCAL_USER" \
  -e "DROP DATABASE IF EXISTS $LOCAL_DB; CREATE DATABASE $LOCAL_DB;"

if [ $? -eq 0 ]; then
    echo "✅ Local database reset"
else
    echo "❌ Error resetting local database"
    exit 1
fi

# Step 3: Import production backup to local
echo ""
echo "📥 Step 3: Importing production data to local database..."
mysql -h "$LOCAL_HOST" -P "$LOCAL_PORT" -u "$LOCAL_USER" \
  "$LOCAL_DB" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Production data successfully imported to local database"
else
    echo "❌ Error importing backup to local database"
    exit 1
fi

# Step 4: Verification
echo ""
echo "🔍 Step 4: Verifying sync..."
TABLE_COUNT=$(mysql -h "$LOCAL_HOST" -P "$LOCAL_PORT" -u "$LOCAL_USER" \
  -e "USE $LOCAL_DB; SHOW TABLES;" | wc -l)
echo "✅ Local database contains $TABLE_COUNT tables"

echo ""
echo "=================================================="
echo "✅ Production Database Sync Complete!"
echo "   Backup saved to: $BACKUP_FILE"
echo "   Local database updated: $LOCAL_DB"
echo "=================================================="
