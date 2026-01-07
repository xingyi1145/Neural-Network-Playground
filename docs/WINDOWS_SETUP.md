# Windows Setup Guide

## Overview

This guide provides Windows-specific instructions for setting up and running the Neural Network Playground project. If you're using Linux or macOS, refer to the main README.md instead.

## Prerequisites

### Required Software

1. **Python 3.10 or higher**
   - Download from: https://www.python.org/downloads/
   - **Important**: Check "Add Python to PATH" during installation

2. **Node.js 18 or higher**
   - Download from: https://nodejs.org/
   - Install the LTS version
   - **Important**: Add to PATH during installation

3. **Git for Windows**
   - Download from: https://git-scm.com/download/win
   - Use default settings during installation

4. **Visual Studio Build Tools** (Optional, for some Python packages)
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Or install pre-built wheels: `pip install --only-binary :all: scikit-learn`

### Verify Installation

Open PowerShell and run:
```powershell
python --version    # Should show Python 3.10+
node --version      # Should show v18+
npm --version       # Should show 9+
git --version       # Should show 2.x
```

## Initial Setup

### 1. Clone the Repository

```powershell
cd C:\Users\YourUsername\Desktop
git clone [repository-url]
cd project_team_8/Project
```

### 2. Backend Setup

```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# If you get execution policy error, run as Administrator:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi, torch; print('Backend dependencies OK')"
```

### 3. Frontend Setup

```powershell
# Navigate to frontend directory
cd src\frontend

# Add Node.js to PATH (if not already)
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

## Running the Application

### Start Backend Server

**Terminal 1:**
```powershell
# Navigate to project root
cd C:\Users\YourUsername\Desktop\project_team_8\Project

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Set PYTHONPATH and start server
$env:PYTHONPATH='src'; python -m uvicorn src.backend.api.main:app --reload --port 8000
```

Backend will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### Start Frontend Server

**Terminal 2:**
```powershell
# Navigate to frontend directory
cd C:\Users\YourUsername\Desktop\project_team_8\Project\src\frontend

# Add Node.js to PATH (if needed)
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

# Start dev server
npm run dev
```

Frontend will be available at:
- http://localhost:5173

## Running Tests

### Backend Tests

```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Run all tests
pytest

# Run specific test file
pytest tests\backend\test_api.py

# Run with coverage
pytest --cov=src --cov-report=html

# View coverage report
start htmlcov\index.html
```

### Frontend Tests

```powershell
cd src\frontend
npm test
```

## Common Commands

### Managing the Virtual Environment

```powershell
# Activate
.\.venv\Scripts\Activate.ps1

# Deactivate
deactivate

# Check if activated (prompt should show (.venv))
```

### Code Quality

```powershell
# Backend - Format code
.\.venv\Scripts\Activate.ps1
black src\backend
isort src\backend

# Backend - Lint
flake8 src\backend

# Frontend - Lint and format
cd src\frontend
npm run lint
npm run format
```

### Git Commands

```powershell
# Create feature branch
git checkout -b issue-#XX-feature-name

# Stage changes
git add .

# Commit (follow conventional commits)
git commit -m "feat: add feature description"

# Push to remote
git push origin issue-#XX-feature-name
```

## Troubleshooting

### Issue: `source` command not recognized

**Problem:**
```
source : The term 'source' is not recognized...
```

**Solution:**
Windows uses different syntax. Replace:
```bash
source .venv/bin/activate
```
With:
```powershell
.\.venv\Scripts\Activate.ps1
```

### Issue: Script execution disabled

**Problem:**
```
cannot be loaded because running scripts is disabled on this system
```

**Solution:**
Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: `python` command not found

**Problem:**
```
python : The term 'python' is not recognized...
```

**Solution:**
1. Reinstall Python with "Add to PATH" checked
2. Or add manually to PATH: `C:\Users\YourUsername\AppData\Local\Programs\Python\Python310`
3. Restart PowerShell

### Issue: `npm` or `node` not found

**Problem:**
```
npm : The term 'npm' is not recognized...
```

**Temporary Solution (current session only):**
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
```

**Permanent Solution:**
1. Search "Environment Variables" in Windows
2. Click "Edit the system environment variables"
3. Click "Environment Variables"
4. Select "Path" under System variables
5. Click "Edit"
6. Click "New"
7. Add: `C:\Program Files\nodejs`
8. Click OK on all dialogs
9. Restart PowerShell

### Issue: Port already in use

**Problem:**
```
Error: listen EADDRINUSE: address already in use :::8000
```

**Solution:**
Find and kill the process:
```powershell
# Find process on port 8000
netstat -ano | findstr :8000

# Note the PID (last column) and kill it
taskkill /PID <PID> /F

# For frontend (port 5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: `scikit-learn` installation fails

**Problem:**
```
error: Microsoft Visual C++ 14.0 or greater is required
```

**Solution A - Use pre-built wheels:**
```powershell
pip install --only-binary :all: scikit-learn
```

**Solution B - Install Build Tools:**
1. Download Visual Studio Build Tools
2. Install "Desktop development with C++"
3. Retry `pip install -r requirements.txt`

### Issue: Module import errors in backend

**Problem:**
```
ModuleNotFoundError: No module named 'src.backend'
```

**Solution:**
Always set PYTHONPATH when running backend:
```powershell
$env:PYTHONPATH='src'; python -m uvicorn src.backend.api.main:app --reload
```

### Issue: Git shows Unix-style paths

**Problem:**
Git output shows `/` instead of `\`

**Solution:**
This is normal - Git uses Unix paths internally. Use Windows paths (`\`) for PowerShell commands.

## PowerShell Tips

### Useful Aliases

Add to your PowerShell profile (`notepad $PROFILE`):
```powershell
# Quick activate
function activate { .\.venv\Scripts\Activate.ps1 }

# Quick backend start
function backend {
    $env:PYTHONPATH='src'
    python -m uvicorn src.backend.api.main:app --reload
}

# Quick frontend start
function frontend {
    cd src\frontend
    npm run dev
}
```

Then use:
```powershell
activate    # Instead of .\.venv\Scripts\Activate.ps1
backend     # Start backend
frontend    # Start frontend
```

### Navigation

```powershell
# Go to project root
cd C:\Users\YourUsername\Desktop\project_team_8\Project

# Create alias (add to $PROFILE)
function proj { cd C:\Users\YourUsername\Desktop\project_team_8\Project }
```

## Additional Resources

- **Main README:** `README.md` (general project info)
- **API Documentation:** http://localhost:8000/docs (when backend running)
- **Contributing Guide:** `CONTRIBUTING.md`
- **Project Setup:** `docs/project-setup/README.md`

## Getting Help

If you encounter issues not covered here:
1. Check the main README troubleshooting section
2. Search existing GitLab issues
3. Ask on team Slack/Discord
4. Create a new GitLab issue with:
   - Error message (full text)
   - Steps to reproduce
   - Your Windows version
   - PowerShell version (`$PSVersionTable`)
