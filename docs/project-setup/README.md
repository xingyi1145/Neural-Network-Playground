# Project Setup Documentation

## Overview

This document explains the initial project setup and development environment configuration for the Neural Network Playground.

## What This MR Does

This merge request establishes the foundational structure and tooling for the Neural Network Playground project, including:

1. **Project Structure**: Complete folder organization for backend, frontend, and documentation
2. **Dependency Management**: Python and Node.js dependencies configured
3. **Code Quality Tools**: Linting and formatting tools for both backend and frontend
4. **Git Workflow**: Branching strategy, commit conventions, and MR templates
5. **Documentation**: Comprehensive README and contribution guidelines

## Changes Made

### Configuration Files

#### Backend Configuration
- **`backend/requirements.txt`**: Python dependencies (FastAPI, PyTorch, scikit-learn, pandas, numpy, pytest, black, flake8, isort)
- **`backend/pyproject.toml`**: Configuration for Black, isort, and pytest
- **`backend/.flake8`**: Flake8 linting rules (100 char line length)
- **`backend/.gitignore`**: Backend-specific gitignore (venv, cache, database files)

#### Frontend Configuration
- **`frontend/package.json`**: NPM dependencies (React, Vite, React Flow, Recharts, Axios, ESLint, Prettier)
- **`frontend/.eslintrc.json`**: ESLint configuration for React
- **`frontend/.prettierrc`**: Prettier formatting rules
- **`frontend/.gitignore`**: Frontend-specific gitignore (node_modules, build files)

#### Root Configuration
- **`.gitignore`**: Root-level gitignore for Python, Node.js, IDE files
- **`CONTRIBUTING.md`**: Comprehensive contribution guidelines (400+ lines)
- **`README.md`**: Complete project documentation (750+ lines)
- **`.gitlab/merge_request_templates/default.md`**: GitLab MR template

## How to Use

### Initial Setup

#### Backend Setup

**Linux/macOS:**
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Windows (PowerShell):**
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Development Workflow

#### Running the Backend

**Linux/macOS:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Windows (PowerShell):**
```powershell
cd backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Backend will be available at:
- API Root: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

#### Running the Frontend
```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:5173

### Code Quality Tools

#### Backend
```bash
# Format code
black app/

# Sort imports
isort app/

# Lint code
flake8 app/

# Run tests
pytest
```

#### Frontend
```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Git Workflow

#### Branch Naming
Follow this pattern: `issue-#<number>-<short-description>`

Examples:
- `issue-#42-add-dataset-loader`
- `issue-#43-fix-training-crash`

#### Commit Messages
Use Conventional Commits format: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Examples:
- `feat: add MNIST dataset loader`
- `fix: resolve training crash on epoch 0`
- `docs: update API documentation`

#### Creating a Merge Request
1. Push your branch to remote
2. Create MR on GitLab
3. Use the MR template in `.gitlab/merge_request_templates/default.md`
4. Request review from at least one team member
5. Address feedback and merge once approved

## File Structure Created

```
project/
├── .gitlab/
│   └── merge_request_templates/
│       └── default.md              # GitLab MR template
├── backend/
│   ├── .flake8                     # Flake8 configuration
│   ├── .gitignore                  # Backend gitignore
│   ├── pyproject.toml              # Black/isort/pytest config
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── .eslintrc.json              # ESLint configuration
│   ├── .gitignore                  # Frontend gitignore
│   ├── .prettierrc                 # Prettier configuration
│   └── package.json                # NPM dependencies
├── .gitignore                      # Root gitignore
├── CONTRIBUTING.md                 # Contribution guidelines
└── README.md                       # Project documentation
```

## Dependencies

### Backend Dependencies
- **FastAPI** (0.104.1): Web framework
- **PyTorch** (2.1.0): Machine learning framework
- **scikit-learn** (1.3.2): Data preprocessing and metrics
- **pandas** (2.1.3) / **NumPy** (1.26.2): Data manipulation
- **pytest** (7.4.3): Testing framework
- **black** (23.11.0): Code formatter
- **flake8** (6.1.0): Linter
- **isort** (5.12.0): Import sorter

### Frontend Dependencies
- **React** (18.2): UI library
- **Vite** (5.0): Build tool
- **React Flow** (11.10): Visual model builder
- **Recharts** (2.10): Training visualizations
- **Axios** (1.6.2): HTTP client
- **ESLint** (8.55): Linter
- **Prettier** (3.1): Code formatter

## Next Steps

After this MR is merged:

1. **Backend developers** can start implementing:
   - Dataset loading and preprocessing
   - Neural network model builder
   - Training engine
   - API endpoints

2. **Frontend developers** can start implementing:
   - Dataset selector component
   - Visual model builder with React Flow
   - Training control panel
   - Metrics visualization with Recharts

3. **All team members** should:
   - Review CONTRIBUTING.md for workflow guidelines
   - Set up their local development environment
   - Install dependencies
   - Verify both backend and frontend run successfully

## Testing

To verify the setup works:

1. **Backend**: Start the server and visit http://localhost:8000/docs
2. **Frontend**: Start the dev server and visit http://localhost:5173
3. **Linting**: Run `flake8` (backend) and `npm run lint` (frontend)
4. **Formatting**: Run `black .` and `isort .` (backend), `npm run format` (frontend)

## Questions?

Refer to:
- **CONTRIBUTING.md** for detailed contribution guidelines
- **README.md** for complete project documentation
- **GitLab issues** for task-specific discussions
- **Team chat** for quick questions
