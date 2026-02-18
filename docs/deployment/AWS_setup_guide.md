# AWS Production Deployment Guide

This guide details how to deploy the Neural Network Playground to AWS EC2 with an RDS PostgreSQL database.

## Prerequisites
* AWS Account
* GitHub Repository with the latest code
* Terminal with SSH client

---

## Phase 1: AWS Infrastructure Setup

### 1. Database (RDS)
1.  Go to **AWS Console > RDS > Create database**.
2.  **Engine:** PostgreSQL (Standard Edition or Free Tier).
3.  **Settings:**
    * **Master username:** `postgres`
    * **Master password:** (Create a strong password and save it).
4.  **Instance Class:** `db.t3.micro` (Free Tier eligible).
5.  **Connectivity:**
    * **Public access:** `No` (Security best practice).
    * **VPC Security Group:** Create new (e.g., `rds-sg`).
6.  **Create Database**.

### 2. Virtual Server (EC2)
1.  Go to **AWS Console > EC2 > Launch Instances**.
2.  **Name:** `nn-playground-prod`
3.  **OS Image:** Ubuntu Server 24.04 LTS (HVM).
4.  **Instance Type:** `t3.medium` (4GB RAM) or `t3.large` (8GB RAM).
    * *Note: `t3.micro` is insufficient for the MNIST dataset.*
5.  **Key Pair:** Create new key pair `nn-playground-key.pem` and download it.
6.  **Network Settings > Security Group:**
    * Allow **SSH** (Port 22) from `My IP`.
    * Allow **HTTP** (Port 80) from `Anywhere (0.0.0.0/0)`.
    * Allow **HTTPS** (Port 443) from `Anywhere (0.0.0.0/0)`.
7.  **Launch Instance**.

### 3. Networking Glue
1.  Go to the **EC2 Instance** details and copy the **Public IPv4 address**.
2.  Go to **RDS > Databases > Connectivity & security > Security Group**.
3.  Edit **Inbound Rules**:
    * **Type:** PostgreSQL (5432)
    * **Source:** Select the **Security Group of your EC2 instance** (e.g., `launch-wizard-1`).
    * *This allows the EC2 server to talk to the database.*

---

## Phase 2: Server Configuration

### 1. SSH Connection
On your local machine, restrict key permissions and connect:
```bash
# Windows users: Use Properties > Security to restrict access to current user only
chmod 400 ~/.ssh/nn-playground-key.pem

ssh -i ~/.ssh/nn-playground-key.pem ubuntu@<EC2_PUBLIC_IP>

## Phase 2: System Preparation (Swap & Permissions)

Run these commands on the EC2 server to prevent "Out of Memory" crashes and fix download permissions for datasets.

```bash
# 1. Update System
sudo apt update && sudo apt upgrade -y

# 2. Add 2GB Swap (Crucial for installation stability on t3.small/medium)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 3. Create App Directory
sudo mkdir -p /var/www/nn-playground/data
sudo chown -R ubuntu:ubuntu /var/www/nn-playground

# 4. Fix Permissions for Dataset Downloads
# Give www-data (the web user) ownership of the data folder
sudo chown -R www-data:www-data /var/www/nn-playground/data

cd /var/www/nn-playground
git clone [https://github.com/xingyi1145/neural-network-playground.git](https://github.com/xingyi1145/neural-network-playground.git) .

# Create the setup script (or upload it via SCP)
nano setup.sh
# (Paste content from deploy/setup.sh)

# Run setup
sudo bash setup.sh

sudo nano .env

# Database Connection
DATABASE_URL=postgresql://postgres:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/postgres

# Security
ALLOWED_ORIGINS=http://<EC2_PUBLIC_IP>

# Data Cache Location (Fixes permission errors)
SCIKIT_LEARN_DATA=/var/www/nn-playground/data

nano src/backend/api/core/config.py

class Config:
    env_file = ".env"
    extra = "ignore"

source venv/bin/activate
export PYTHONPATH=src
alembic upgrade head


sudo nano /etc/systemd/system/nn-playground.service
# Change the ExecStart line to:
ExecStart=/var/www/nn-playground/venv/bin/uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --workers 1

# Apply changes and restart the application:
sudo systemctl daemon-reload
sudo systemctl restart nn-playground
sudo systemctl restart nginx

# Go to your GitHub Repository > Settings > Secrets and variables > Actions.
# Add the following Repository secrets:
Secret Name,Value
PRODUCTION_HOST,"Your EC2 Public IP (e.g., 3.99.249.131)"
PRODUCTION_USER,ubuntu
PRODUCTION_SSH_KEY,The content of your .pem private key file