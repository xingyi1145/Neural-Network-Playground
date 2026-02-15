#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# Deploy / update script for Neural Network Playground
# Pulls latest code, rebuilds, migrates, and restarts.
# Usage:  sudo bash deploy.sh
# ──────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/nn-playground"
cd "$APP_DIR"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "==> Pulling latest code (branch: $BRANCH)..."
git pull origin "$BRANCH"

echo "==> Activating virtual environment..."
source venv/bin/activate

echo "==> Installing Python dependencies..."
pip install -r requirements.txt --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple/

echo "==> Building frontend..."
cd src/frontend
npm ci
npm run build
cd "$APP_DIR"

echo "==> Running database migrations..."
PYTHONPATH=src alembic upgrade head

echo "==> Restarting service..."
systemctl restart nn-playground

echo "==> Waiting for service to start..."
sleep 3

echo "==> Health check..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/health || true)

if [ "$HTTP_STATUS" = "200" ]; then
    echo ""
    echo "  ✓ Deploy successful! API returned HTTP 200."
    echo ""
else
    echo ""
    echo "  ✗ Health check failed (HTTP $HTTP_STATUS)."
    echo "    Check logs:  sudo journalctl -u nn-playground -n 50"
    echo ""
    exit 1
fi
