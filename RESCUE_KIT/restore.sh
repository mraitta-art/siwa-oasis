#!/usr/bin/env bash

# ==============================================================================
# SIWIFY / SIWA OASIS — 1-CLICK LINUX & MACOS RESCUE & RESTORE SCRIPT
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR="$(dirname "$DIR")"

cd "$PROJECT_DIR"

echo "======================================================"
echo "   🚀 SIWIFY.COM — 1-CLICK LINUX/MACOS BOOTSTRAPPER"
echo "======================================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ (e.g. nvm install 20 or sudo apt install nodejs)"
    exit 1
fi

# Run Node Restorer
node "$DIR/restore.js"

read -p "Do you want to run 'npm install' and start dev server now? (y/n): " confirm
if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo "📦 Installing project dependencies..."
    npm install
    echo "🚀 Starting Local Server on http://localhost:3000..."
    npm run dev
fi
