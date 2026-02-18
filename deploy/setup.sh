#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# First-time EC2 server setup for Neural Network Playground
# Run as root (or with sudo) on a fresh Ubuntu 22.04 instance
# Usage:  sudo bash setup.sh
# ──────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/nn-playground"
REPO_URL="https://github.com/xingyi1145/Neural-Network-Playground.git"
BRANCH="main"

echo "==> Updating system packages..."
apt-get update && apt-get upgrade -y

# ── Python 3.11 ──────────────────────────────────────────
echo "==> Installing Python 3.11..."
apt-get install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update
apt-get install -y python3.11 python3.11-venv python3.11-dev

# ── Node.js 18 ───────────────────────────────────────────
echo "==> Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# ── Nginx ─────────────────────────────────────────────────
echo "==> Installing Nginx..."
apt-get install -y nginx

# ── Certbot (for SSL later) ──────────────────────────────
echo "==> Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# ── PostgreSQL client libs (needed by psycopg2) ──────────
echo "==> Installing PostgreSQL client libraries..."
apt-get install -y libpq-dev

# ── Git ───────────────────────────────────────────────────
apt-get install -y git

# ── Clone repository ─────────────────────────────────────
echo "==> Cloning repository..."
if [ -d "$APP_DIR" ]; then
    echo "    App directory already exists, pulling latest..."
    cd "$APP_DIR" && git pull origin "$BRANCH"
else
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

# ── Python virtual environment ───────────────────────────
echo "==> Creating Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple/

# ── Frontend build ───────────────────────────────────────
echo "==> Building frontend..."
cd src/frontend
npm ci
npm run build
cd "$APP_DIR"

# ── Environment file ─────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
    echo "==> Creating .env from example..."
    cp src/backend/api/.env_example "$APP_DIR/.env"
    echo ""
    echo "  ⚠  IMPORTANT: Edit $APP_DIR/.env with your actual DATABASE_URL and ALLOWED_ORIGINS"
    echo ""
fi

# ── Run database migrations ──────────────────────────────
echo "==> Running Alembic migrations..."
cd "$APP_DIR"
PYTHONPATH=src venv/bin/alembic upgrade head

# ── Nginx configuration ─────────────────────────────────
echo "==> Configuring Nginx..."
cp deploy/nginx.conf /etc/nginx/sites-available/nn-playground
ln -sf /etc/nginx/sites-available/nn-playground /etc/nginx/sites-enabled/nn-playground
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ── Systemd service ──────────────────────────────────────
echo "==> Installing systemd service..."
cp deploy/nn-playground.service /etc/systemd/system/nn-playground.service
systemctl daemon-reload
systemctl enable nn-playground
systemctl start nn-playground

# ── Set ownership ────────────────────────────────────────
echo "==> Setting file ownership..."
chown -R www-data:www-data "$APP_DIR"

# ── Firewall ─────────────────────────────────────────────
echo "==> Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# ── Done ─────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "  Next steps:"
echo "  1. Edit $APP_DIR/.env with your RDS DATABASE_URL"
echo "  2. Set ALLOWED_ORIGINS to your domain"
echo "  3. Run: sudo systemctl restart nn-playground"
echo "  4. Set up SSL:  sudo certbot --nginx -d yourdomain.com"
echo ""
echo "  Check status:  sudo systemctl status nn-playground"
echo "  View logs:     sudo journalctl -u nn-playground -f"
echo ""
