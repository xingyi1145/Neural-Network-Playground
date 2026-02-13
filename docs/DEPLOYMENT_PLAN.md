# Deployment Plan: AWS EC2 + PostgreSQL (RDS) + CI/CD with Staging

## Context
The Neural Network Playground is a full-stack educational app (React + FastAPI + PyTorch) currently configured for local development only. It has no deployment infrastructure, no persistent database (uses in-memory Python dicts), and no CI/CD. This plan adds production deployment to AWS EC2, replaces in-memory storage with PostgreSQL on RDS, and sets up a GitHub Actions CI/CD pipeline with staging and production environments.

---

## Phase 1: PostgreSQL Persistence Layer

### 1.1 Add dependencies
**File:** `requirements.txt`
- Add `psycopg2-binary==2.9.9` (PostgreSQL driver)
- Add `alembic==1.13.1` (database migrations)
- Pin `torch==2.2.0` with `--index-url` for CPU-only (save disk/install time on EC2)

### 1.2 Create database module
**New file:** `src/backend/database.py`
- SQLAlchemy engine creation from `DATABASE_URL`
- `SessionLocal` sessionmaker factory
- `Base` declarative base
- `get_db()` dependency for FastAPI route injection

### 1.3 Create ORM models
**New file:** `src/backend/db_models.py`
- `ModelConfigDB` table: id (UUID PK), name, dataset_id, description, layers (JSON column), status, created_at
- `TrainingSessionDB` table: session_id (UUID PK), model_id (FK), dataset_id, status, total_epochs, current_epoch, start_time, end_time, error_message
- `TrainingMetricDB` table: id (auto PK), session_id (FK), epoch, loss, accuracy, timestamp

### 1.4 Scaffold Alembic
- Run `alembic init` to create migrations directory
- Configure `alembic.ini` and `env.py` to read `DATABASE_URL` from app config
- Create initial migration from the ORM models

### 1.5 Update model routes to use DB
**File:** `src/backend/api/routes/models.py`
- Replace `MODEL_STORE` dict with database queries
- `create_model()`: insert into `ModelConfigDB`, return response
- `get_model()`: query `ModelConfigDB` by ID
- Inject `db: Session = Depends(get_db)` into route functions

### 1.6 Update training routes to use DB
**File:** `src/backend/api/routes/training.py`
- **Important:** Live training state (`TrainingEngine`, `Future` objects) MUST remain in-memory — they're runtime Python objects that can't be serialized to a DB
- `ModelRegistry`: replace `_models` dict with DB lookups against `ModelConfigDB`
- `TrainingSessionManager`: persist session metadata/metrics to DB, keep `_jobs` dict in-memory for active engine references
- On training start: create `TrainingSessionDB` row, store engine/future in `_jobs`
- On status poll: read metrics from DB (and also from live engine for current session)
- On training complete (callback): flush final metrics to DB, remove from `_jobs`

### 1.7 Update app startup
**File:** `src/backend/api/main.py`
- Add startup event to create tables (or rely on Alembic migrations)
- Initialize DB engine on app start

---

## Phase 2: Production Code Fixes

### 2.1 Fix hardcoded localhost
**File:** `src/frontend/src/api/client.js`
- Change `baseURL: 'http://localhost:8000/api'` → `baseURL: '/api'` (use relative URL, Nginx will proxy)

### 2.2 Make CORS configurable
**File:** `src/backend/api/core/cors.py`
- Read `ALLOWED_ORIGINS` from environment variable (comma-separated)
- Default to `["http://localhost:5173", "http://localhost:3000"]` for dev

**File:** `src/backend/api/core/config.py`
- Add `ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"` to Settings

### 2.3 Add missing frontend test script
**File:** `src/frontend/package.json`
- Add `"test": "vitest run"` to scripts

### 2.4 Update .env_example
**File:** `src/backend/api/.env_example`
- Add `ALLOWED_ORIGINS=`, `DATABASE_URL=postgresql://...` examples

---

## Phase 3: Deployment Infrastructure

### 3.1 Nginx config
**New file:** `deploy/nginx.conf`
- Listen on port 80 (Certbot will add 443)
- `location /` → serve `/var/www/nn-playground/dist/` (built React app)
- `location /api` → `proxy_pass http://127.0.0.1:8000`
- `location /docs` → proxy to FastAPI Swagger UI
- Gzip compression, caching for static assets
- `server_name` placeholder for domain

### 3.2 Systemd service
**New file:** `deploy/nn-playground.service`
- Run Uvicorn with `--workers 2` (no `--reload`)
- Set `PYTHONPATH=src`
- Set `DATABASE_URL` from environment
- Auto-restart on failure
- Run as dedicated `www-data` user

### 3.3 Server setup script
**New file:** `deploy/setup.sh`
- Install system packages: Python 3.11, Node.js 18, Nginx, Certbot, PostgreSQL client libs
- Create app directory structure
- Clone repo, create venv, install Python deps
- Build frontend
- Copy Nginx config, enable site
- Install and enable systemd service
- Run Alembic migrations
- Firewall rules (ufw: allow 22, 80, 443)

### 3.4 Deploy/update script
**New file:** `deploy/deploy.sh`
- `git pull`
- `pip install -r requirements.txt`
- `cd src/frontend && npm ci && npm run build`
- `alembic upgrade head`
- `sudo systemctl restart nn-playground`
- Health check: curl the API

---

## Phase 4: CI/CD Pipeline (GitHub Actions)

### 4.1 Test & Lint workflow (runs on all PRs and pushes)
**New file:** `.github/workflows/ci.yml`
- **Backend job:**
  - Set up Python 3.11
  - Install dependencies
  - Run `black --check`, `flake8`, `isort --check`
  - Run `pytest --cov` with SQLite for tests (no need for PostgreSQL in CI for unit tests)
- **Frontend job:**
  - Set up Node.js 18
  - `npm ci` in `src/frontend`
  - Run `npm run lint`
  - Run `npm test`

### 4.2 Deploy to staging (runs on PR to main)
**New file:** `.github/workflows/deploy-staging.yml`
- Triggered after CI passes on a PR
- SSH into staging EC2 instance
- Run `deploy/deploy.sh` targeting staging environment
- Uses GitHub Secrets for SSH key, host IP, DB URL

### 4.3 Deploy to production (runs on merge to main)
**New file:** `.github/workflows/deploy-production.yml`
- Triggered on push to `main` (after PR merge)
- SSH into production EC2 instance
- Run `deploy/deploy.sh` targeting production environment
- Uses separate GitHub Secrets for production SSH key, host IP, DB URL

---

## Phase 5: AWS Infrastructure Setup (Manual / Documented)

### 5.1 Documentation
**New file:** `deploy/AWS_SETUP.md`
Step-by-step guide for:
1. Launch EC2 instances (staging + production) — Ubuntu 22.04, t3.medium, 30GB gp3
2. Allocate Elastic IPs and associate
3. Configure Security Groups (22, 80, 443 inbound)
4. Create RDS PostgreSQL instance (db.t3.micro, 20GB, staging + production DBs)
5. Configure RDS security group (allow 5432 from EC2 SG only)
6. Set up GitHub Secrets (SSH keys, host IPs, DB URLs)
7. DNS configuration (A records pointing to Elastic IPs)
8. SSL setup with Certbot

---

## Decision Rationale

### PostgreSQL Driver: `psycopg2-binary`
- App uses sync routes and a synchronous training engine in `ThreadPoolExecutor`. `psycopg2` is the most battle-tested sync PostgreSQL driver.
- `asyncpg` would require converting to `AsyncSession` and rewriting the training engine — unnecessary complexity.
- `-binary` variant ships pre-compiled, no PostgreSQL dev headers needed.

### Layers Stored as JSON Column (not normalized table)
- Layers are always read/written as a complete list — never queried individually.
- A normalized table would add JOINs, ordering logic, and 5-10 rows per model for no practical benefit.
- PostgreSQL `JSONB` has excellent support and indexing if needed later.

### Training Jobs: Hybrid (DB + In-Memory)
- `TrainingEngine` contains live PyTorch models, optimizer state, and running threads — cannot be serialized to a DB.
- Session metadata and metrics persist to DB so users can see training history after restart.
- Live engine/future references stay in `_jobs` dict for pause/resume/stop during the process lifetime.

### Alembic (not auto-create tables)
- `Base.metadata.create_all()` can't handle schema changes after initial setup.
- Once on RDS with real data, proper migrations are essential for adding columns, changing types, etc.

### Relative URL `/api` in client.js (not env variable)
- `services/api.js` already uses `/api` successfully. `api/client.js` is the outlier with hardcoded localhost.
- Nginx proxies `/api` to Uvicorn, so relative URLs work in every environment with zero config.

### CORS via Environment Variable
- Origins differ per environment (localhost in dev, domain in staging/production).
- `pydantic-settings` already supports `.env` files, so this fits naturally.

### CPU-Only PyTorch
- Full `torch` with CUDA is ~2.5GB vs ~200MB for CPU-only.
- EC2 `t3.medium` has no GPU. Datasets are small — CPU training is fast enough.

### Nginx (not Caddy/Traefik)
- Industry standard, pre-packaged on Ubuntu, best Certbot integration.
- Traefik is designed for container orchestration — overkill for single server.

### Systemd (not Docker/PM2)
- No existing Dockerfile. Systemd is already on EC2 — zero extra dependencies.
- Handles auto-restart, logging (journalctl), and startup-on-boot natively.

### EC2 `t3.medium` (2 vCPU, 4GB RAM)
- PyTorch takes ~500MB RAM to import. 2GB (`t3.small`) risks OOM during training.
- 4GB handles Uvicorn (2 workers) + Nginx + training job simultaneously.
- Burstable CPU fits usage: mostly idle, bursts during training.

### GitHub Actions (not Jenkins/CodePipeline)
- Code is on GitHub. Actions is built-in, free for public repos, zero infrastructure.
- Jenkins needs a server. CodePipeline needs IAM, CodeBuild, CodeDeploy agents.

### SSH Deploy (not CodeDeploy/Container Registry)
- Simplest for single-server. Script does: git pull, install, build, migrate, restart.
- CodeDeploy needs agent + IAM roles + S3 — significant setup for minimal benefit on one server.

### Separate Staging EC2 (not same-box different port)
- True replica of production — same OS, same Nginx config, same setup.
- Bad staging deploy can't affect production (separate CPU/RAM/disk).

### Three Workflow Files (not monolithic)
- Separation of concerns: CI on every push, staging on PR, production on merge.
- Easier to debug failures in isolation.

### AWS Setup Guide (not Terraform)
- For 2 EC2 + 1 RDS + security groups, Console takes ~20 minutes — done once.
- Terraform adds HCL syntax, state files, IAM permissions, and a learning curve.

---

## Files Summary

### Modified (existing)
| File | Change |
|------|--------|
| `requirements.txt` | Add psycopg2-binary, alembic; pin torch |
| `src/backend/api/core/config.py` | Add ALLOWED_ORIGINS setting |
| `src/backend/api/core/cors.py` | Read origins from config |
| `src/backend/api/main.py` | Add DB init on startup |
| `src/backend/api/routes/models.py` | Replace MODEL_STORE with DB queries |
| `src/backend/api/routes/training.py` | Persist sessions/metrics to DB |
| `src/frontend/src/api/client.js` | Fix hardcoded localhost |
| `src/frontend/package.json` | Add test script |
| `src/backend/api/.env_example` | Add new env var examples |

### Created (new)
| File | Purpose |
|------|---------|
| `src/backend/database.py` | SQLAlchemy engine, session, Base |
| `src/backend/db_models.py` | ORM table models |
| `alembic.ini` | Alembic config |
| `alembic/` | Migrations directory + initial migration |
| `deploy/nginx.conf` | Production Nginx config |
| `deploy/nn-playground.service` | Systemd unit file |
| `deploy/setup.sh` | EC2 first-time setup script |
| `deploy/deploy.sh` | Code update + restart script |
| `deploy/AWS_SETUP.md` | AWS infrastructure setup guide |
| `.github/workflows/ci.yml` | Test + lint pipeline |
| `.github/workflows/deploy-staging.yml` | Staging deploy pipeline |
| `.github/workflows/deploy-production.yml` | Production deploy pipeline |

---

## Verification
1. **Database:** Run `alembic upgrade head` locally with a PostgreSQL instance, verify tables created
2. **Backend tests:** Run `pytest` — all existing tests should still pass (they use TestClient, not a real DB)
3. **Frontend tests:** Run `cd src/frontend && npm test` — verify tests pass
4. **Frontend build:** Run `npm run build` — verify dist/ is produced
5. **Nginx config:** Validate with `nginx -t`
6. **CI pipeline:** Push a PR and verify GitHub Actions runs tests + lint successfully
7. **End-to-end:** After EC2 setup, verify the app loads in a browser and training works
