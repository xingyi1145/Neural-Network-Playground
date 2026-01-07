# Neural Network Playground

**Project Type:** Educational ML Tool
**Timeline:** Nov 2 - Nov 24, 2025 (3.5 weeks)
**Team Size:** 5 developers
**Current Sprint:** Sprint 2 (Nov 9-15, 2025)

---

## Project Vision

An accessible, interactive web application that enables beginners to learn neural networks by visually designing, training, and testing Multi-Layer Perceptrons **without writing code**.

### Target User
**"Alex the ML Beginner"** - Computer science student with basic Python knowledge, curious about neural networks but intimidated by the steep learning curve of PyTorch/TensorFlow.

### Success Criteria
A user with basic ML knowledge can complete the full workflow (select dataset → build model → train → test) in <15 minutes and understand how model complexity affects performance.

---

## Quick Start

> **Windows Users:** For a comprehensive Windows-specific guide including troubleshooting and PowerShell tips, see **[docs/WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md)**

### For Developers

#### Backend Setup

**Linux/macOS:**
```bash
# Navigate to project directory
cd project_team_8/Project

# Activate virtual environment
source .venv/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Run backend server (PYTHONPATH must include src directory)
PYTHONPATH=src uvicorn src.backend.api.main:app --reload --port 8000
```

**Windows (PowerShell):**
```powershell
# Navigate to project directory
cd project_team_8/Project

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies (if needed)
pip install -r requirements.txt

# Run backend server
$env:PYTHONPATH='src'; python -m uvicorn src.backend.api.main:app --reload --port 8000
```

#### Frontend Setup (Sprint 2+)
```bash
# Navigate to frontend directory
cd src/frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```
*Note for Windows users: If `npm` is not recognized, ensure Node.js is in your PATH or run:*
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run dev
```

#### Access Points
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Frontend:** http://localhost:5173 (Sprint 2+)

---

## Project Status

### Sprint 1 (Nov 2-8): Complete
**Goal:** Foundation & Data Layer

**Completed:**
- 5 datasets implemented (MNIST, Iris, California Housing, Wine Quality, Synthetic)
- Dataset API endpoints (GET operations)
- 2 MNIST templates (Simple MLP, Deep MLP)
- Template API endpoints
- Testing infrastructure (pytest + FastAPI TestClient)
- Project documentation (charter, requirements, setup guides)

**Metrics:**
- Backend code: 649 lines
- Test code: 214 lines
- Documentation: 80+ KB across 9 files
- Test coverage: ~45-50%

### Sprint 2 (Nov 9-15): In Progress
**Goal:** Core Training System

**Deliverables:**
- [ ] Dynamic model builder (JSON → PyTorch)
- [ ] PyTorch training engine with real-time metrics
- [ ] Model & Training API endpoints
- [ ] 8 additional templates (for all datasets)
- [ ] Frontend project setup (React + Vite)
- [ ] API contract documentation
- [ ] Integration tests

**Metrics:**
- Total tasks: 12
- Story points: 53
- Team capacity: 51 points

### Sprint 3 (Nov 16-22): Upcoming
**Goal:** Frontend UI & Integration

**Planned:**
- Visual drag-and-drop model builder (React Flow)
- Training dashboard with live charts (Recharts)
- Testing/evaluation interface
- 1-2 interactive tutorials
- Full backend-frontend integration

### Sprint 4 (Nov 23-24): Upcoming
**Goal:** Polish & Launch

**Planned:**
- Bug fixes and optimization
- User documentation
- Deployment preparation
- Final demo and presentation

---

## Architecture

### Tech Stack

#### Backend
- **Framework:** FastAPI 0.104.1
- **ML Library:** PyTorch 2.1.0
- **Data Processing:** NumPy, Pandas, scikit-learn 1.3.2
- **Testing:** pytest 7.4.3
- **Server:** uvicorn 0.24.0

#### Frontend (Sprint 2+)
- **Framework:** React 18 + Vite
- **Drag-and-Drop:** React Flow
- **Visualization:** Recharts
- **Styling:** Tailwind CSS
- **State:** React Context API

#### Infrastructure
- **Version Control:** Git + GitLab
- **Development:** Local (Vite dev server + uvicorn)
- **Deployment:** Docker (optional, Sprint 4)

### System Architecture
```
┌─────────────────────────────────────────┐
│           FRONTEND (React)              │
│  Dataset Selector → Visual Builder →   │
│  Training Dashboard → Testing UI        │
└──────────────┬──────────────────────────┘
               │ REST API + WebSocket
┌──────────────┴──────────────────────────┐
│           BACKEND (FastAPI)             │
│  Dataset API → Model API → Training API │
│  Dynamic model.py → PyTorch Engine      │
└─────────────────────────────────────────┘
```

---

## Features

### Current Features (Sprint 1)
- **5 Curated Datasets**
- MNIST (digit recognition, 784 features)
- Iris (classification, 4 features)
- California Housing (regression, 8 features)
- Wine Quality (classification, 11 features)
- Synthetic XOR/Spiral (classification, 2 features)

- **Dataset API**
- Browse datasets with metadata
- Preview sample data
- Pre-configured hyperparameters (learning rate, batch size, epochs)

- **Template System**
- 2 MNIST templates (Simple MLP, Deep MLP)
- Filter templates by dataset

- **Testing Infrastructure**
- 13 test functions, 17 test cases
- Automated testing via pytest

### Upcoming Features (Sprint 2)
- **Dynamic Model Construction**
- Convert JSON layer specs to PyTorch models
- Validate model architectures
- Support multiple activation functions (ReLU, Sigmoid, Tanh, Softmax)

- **Training System**
- Train models on all datasets
- Real-time progress tracking
- <5 minute training time (CPU)

- **Training API**
- Create models via API
- Start/stop training sessions
- Poll training status and metrics

- **Template Expansion**
- 10 total templates (all datasets covered)

- **Frontend Foundation**
- React project with routing
- API service layer
- API contract documentation

### Future Features (Sprint 3-4)
- **Visual Model Builder**
- Drag-and-drop layers
- Configure neurons and activations
- Real-time architecture validation

- **Training Dashboard**
- Live loss/accuracy curves
- Epoch progress tracking
- Start/stop controls

- **Testing Interface**
- Evaluate model on test set
- Display metrics and visualizations

- **Educational Content**
- Interactive tutorials
- Tooltips explaining concepts
- Error guidance

---

## Documentation

### For Developers
- **[Windows Setup Guide](docs/WINDOWS_SETUP.md)** - Complete Windows-specific setup and troubleshooting
- **[Project Charter](docs/charter.md)** - Project scope, timeline, team structure
- **[Requirements](docs/requirements.md)** - Functional and technical requirements
- **[Sprint 1 Analysis](docs/SPRINT1_COMPLETION_ANALYSIS.md)** - Sprint 1 completion report
- **[Sprint 2 Backlog](docs/SPRINT2_BACKLOG.md)** - Detailed Sprint 2 tasks
- **[Sprint 2 Quick Start](docs/SPRINT2_QUICK_START.md)** - Getting started with Sprint 2
- **[Sprint 2 Summary](docs/SPRINT2_SUMMARY.md)** - Sprint 2 overview
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs (when server running)

### Dataset Documentation
- **[Dataset Overview](docs/datasets/README.md)** - All dataset specifications
- **[Project Setup Guide](docs/project-setup/README.md)** - Installation instructions

### Sprint-Specific Documentation
- **[Sprint 1 Docs](docs/sprint1/)** - Sprint 1 deliverables
- **[Sprint 2 Docs](docs/sprint2/)** - Sprint 2 deliverables (in progress)

### Example Code
- **[Examples Directory](examples/)** - Standalone, runnable examples
- Examples demonstrate dataset loading, API usage, model training, etc.

---

## Development Guidelines

### Workflow
1. **Create feature branch:** `git checkout -b issue-#XX-feature-name`
2. **Develop with tests:** Write code + tests (>50% coverage)
3. **Document:** Create doc (<50 lines) in `/docs/sprint2/`
4. **Add example:** Create example in `/examples/`
5. **Code review:** Submit MR with ≥1 reviewer
6. **Merge:** Merge to main after approval

### Code Quality
- **Python:** black (formatting), flake8 (linting), isort (imports)
- **Testing:** pytest with >50% coverage for critical paths
- **Type Hints:** Required for all Python functions
- **Documentation:** Docstrings for all classes and functions

### MR Requirements
Each merge request must include:
- [ ] Code implementing acceptance criteria
- [ ] Unit tests with >50% coverage
- [ ] Documentation (<50 lines in `/docs/sprint2/`)
- [ ] Example code in `/examples/`
- [ ] Code review approval
- [ ] All tests passing

---

## Team

### Team Structure
- **Backend Team (2):** Yi Xing, Sicheng Ouyang
- **Frontend Team (2):** David Estrine, Kevin Yan
- **ML/Data + QA (1):** Ario Ostovary

### Sprint 2 Assignments
- **Yi Xing:** Dynamic model builder, training engine
- **Sicheng Ouyang:** Model & training API endpoints
- **David Estrine:** Frontend project setup
- **Kevin Yan:** API service layer
- **Ario Ostovary:** Templates, integration tests

---

## Testing

### Running Tests

**Linux/macOS:**
```bash
# All tests
pytest

# Specific test file
pytest tests/test_api.py

# With coverage
pytest --cov=src --cov-report=html

# View coverage report
open htmlcov/index.html
```

**Windows (PowerShell):**
```powershell
# Activate virtual environment first
.\.venv\Scripts\Activate.ps1

# All tests
pytest

# Specific test file
pytest tests/test_api.py

# With coverage
pytest --cov=src --cov-report=html

# View coverage report
start htmlcov/index.html
```

### Test Coverage
- **Current:** ~45-50% (Sprint 1)
- **Target:** >50% for critical paths
- **Sprint 2:** Add integration tests for training flow

---

## API Endpoints

### Current Endpoints (Sprint 1)
- `GET /` - API information
- `GET /health` - Health check
- `GET /api/datasets` - List all datasets
- `GET /api/datasets/{id}` - Get dataset details
- `GET /api/datasets/{id}/preview` - Preview sample data
- `GET /api/templates` - List all templates
- `GET /api/templates?dataset_id={id}` - Filter templates by dataset
- `GET /api/templates/{id}` - Get template details

### Upcoming Endpoints (Sprint 2)
- `POST /api/models` - Create model from JSON
- `GET /api/models/{id}` - Get model details
- `POST /api/models/{id}/train` - Start training
- `GET /api/training/{session_id}/status` - Poll training progress
- `POST /api/training/{session_id}/stop` - Stop training
- `POST /api/models/{id}/test` - Evaluate model

---

## Contributing

### For Team Members
1. Read [Sprint 2 Backlog](docs/SPRINT2_BACKLOG.md) for current tasks
2. Check [Sprint 2 Task Tracker](docs/SPRINT2_TASK_TRACKER.md) for progress
3. Follow [Sprint 2 Quick Start](docs/SPRINT2_QUICK_START.md) for workflow
4. Update task tracker after daily standup

### Code Standards
- Follow existing code structure and patterns
- Write tests before submitting MR
- Document all public APIs
- Add examples for new features
- Keep docs concise (<50 lines)

---

## Project Constraints

- **Timeline:** 23 days (Nov 2-24, 2025)
- **Scope:** MLP architectures only (no CNNs, RNNs)
- **Interface:** 100% visual (no code viewing/editing)
- **Hyperparameters:** Pre-configured (users cannot tune)
- **Deployment:** Local only (no cloud infrastructure)
- **Hardware:** CPU-only training
- **Performance:** Training <5 min per dataset

---

## Troubleshooting (Windows Users)

### Common Issues and Solutions

#### 1. `source` command not recognized
**Problem:** `source: The term 'source' is not recognized...`

**Solution:** Windows PowerShell uses different syntax:
```powershell
# Instead of: source .venv/bin/activate
# Use:
.\.venv\Scripts\Activate.ps1
```

#### 2. `npm` or `node` not recognized
**Problem:** `npm : The term 'npm' is not recognized...`

**Solution:** Node.js is not in your PATH. Use one of these options:

**Option A - Temporary (current session only):**
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
```

**Option B - Permanent (recommended):**
1. Search for "Environment Variables" in Windows
2. Click "Edit the system environment variables"
3. Click "Environment Variables" button
4. Under "System variables", find and select "Path"
5. Click "Edit"
6. Click "New" and add: `C:\Program Files\nodejs`
7. Click "OK" on all windows
8. Restart PowerShell

#### 3. Python virtual environment activation fails
**Problem:** Script execution is disabled

**Solution:** Enable script execution in PowerShell (run as Administrator):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 4. PYTHONPATH not set correctly
**Problem:** Backend fails to import modules

**Solution:** Set PYTHONPATH before running uvicorn:
```powershell
$env:PYTHONPATH='src'; python -m uvicorn src.backend.api.main:app --reload
```

#### 5. Missing dependencies (scikit-learn compilation error)
**Problem:** `scikit-learn` fails to install due to C++ compiler missing

**Solution:**
- Install Visual Studio Build Tools from Microsoft
- Or use pre-built wheels: `pip install --only-binary :all: scikit-learn`

#### 6. Port already in use
**Problem:** Backend or frontend fails to start - port in use

**Solution:** Find and kill the process using the port:
```powershell
# Find process on port 8000 (backend)
netstat -ano | findstr :8000

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F

# Same for port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

#### 7. Git commands use wrong path separators
**Problem:** Git shows paths with forward slashes but Windows uses backslashes

**Solution:** This is normal - Git uses Unix-style paths internally. Use PowerShell's backslashes for local commands.

---

## License & Credits

**Project:** Neural Network Playground
**Course:** SE101 - Introduction to Methods of Software Engineering
**Institution:** University of Waterloo
**Term:** Fall 2025
**Team:** Team 8

---

## Contact

**Team Communication:** [Team Slack/Discord channel]
**Project Repository:** [GitLab URL]
**Issue Tracker:** [GitLab Issues]

---

**Status:** Active Development
**Last Updated:** Nov 13, 2025
**Next Milestone:** Sprint 2 Review (Nov 15, 2025)
