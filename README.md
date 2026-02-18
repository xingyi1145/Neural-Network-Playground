# Neural Network Playground

**Project Type:** Educational ML Tool
**Status:** Completed
**Timeline:** Nov 2025
**Team Size:** 5 developers

---

## Project Vision

An accessible, interactive web application that enables beginners to learn neural networks by visually designing, training, and testing Multi-Layer Perceptrons **without writing code**.

## Try it Live!

Skip the setup and experience the Neural Network Playground directly in your browser.

**Visit the live app:** [**nurel.app**](https://nurel.app/)

---

### Target User
**"Alex the ML Beginner"** - Computer science student with basic Python knowledge, curious about neural networks but intimidated by the steep learning curve of PyTorch/TensorFlow.

### Success Criteria
A user with basic ML knowledge can complete the full workflow (select dataset → build model → train → test) in <15 minutes and understand how model complexity affects performance.

---

## Quick Start

> **Windows Users:** For a comprehensive Windows-specific guide including troubleshooting and PowerShell tips, see **[docs/WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md)**

### Prerequisites
- Python 3.12+
- Node.js 18+

### Setup Instructions

#### 1. Backend Setup

**Linux/macOS:**
```bash
# Navigate to project directory
cd Project

# Create and activate virtual environment (optional but recommended)
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server (PYTHONPATH must include src directory)
PYTHONPATH=src uvicorn src.backend.api.main:app --reload --port 8000
```

**Windows (PowerShell):**
```powershell
# Navigate to project directory
cd Project

# Activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run backend server
$env:PYTHONPATH='src'; python -m uvicorn src.backend.api.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd src/frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```
*Note for Windows users: If `npm` is not recognized, ensure Node.js is in your PATH.*

#### Access Points
- **Frontend App:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Features

### Core Functionality
- **Visual Model Builder**: Drag-and-drop interface to design Neural Networks (MLPs) using React Flow.
- **Interactive Training**: Watch your model learn in real-time with live Loss and Accuracy graphs.
- **Dataset Library**: 5 curated datasets for Classification and Regression tasks:
  - **MNIST** (Digit Recognition)
  - **Iris** (Flower Classification)
  - **California Housing** (Price Prediction)
  - **Wine Quality** (Quality Classification)
  - **Synthetic** (Spiral/XOR patterns)
- **Template System**: Pre-built architectures to get started quickly.

### Technical Features
- **Dynamic PyTorch Engine**: Backend automatically constructs PyTorch models from JSON architecture specs.
- **Real-time Metrics**: WebSocket/Polling integration for live training updates.
- **Layer Support**: Linear, ReLU, Sigmoid, Tanh, Conv2d, MaxPool2d, Flatten, Dropout.
- **Configurable Hyperparameters**: Learning rate, batch size, and epochs (pre-configured for ease of use).

---

## Architecture

### Tech Stack

#### Backend
- **Framework:** FastAPI
- **ML Library:** PyTorch
- **Data Processing:** NumPy, Pandas, scikit-learn
- **Testing:** pytest
- **Server:** Uvicorn

#### Frontend
- **Framework:** React + Vite
- **Drag-and-Drop:** React Flow
- **Visualization:** Recharts
- **Styling:** Tailwind CSS
- **State:** React Context API

### System Architecture
```
┌─────────────────────────────────────────┐
│           FRONTEND (React)              │
│  Dataset Selector → Visual Builder →    │
│  Training Dashboard → Testing UI        │
└──────────────┬──────────────────────────┘
               │ REST API
┌──────────────┴──────────────────────────┐
│           BACKEND (FastAPI)             │
│  Dataset API → Model API → Training API │
│  Dynamic model.py → PyTorch Engine      │
└─────────────────────────────────────────┘
```

---

## Documentation

- **[User Manual](docs/user_manual.md)** - Guide for end-users to operate the app.
- **[Test Report](docs/test_report.md)** - Summary of test execution and coverage.
- **[Dataset Overview](docs/datasets/README.md)** - Details on available datasets.
- **[Windows Setup](docs/WINDOWS_SETUP.md)** - Specific setup guide for Windows.

---

## Development & Testing

### Running Tests
```bash
# Run all backend tests
pytest

# Run specific test file
pytest tests/backend/test_api.py

# Run frontend tests
cd src/frontend
npm run test
```

### Contributing
- **Code Style:** PEP 8 (Python), Prettier (JS/React)
- **Testing:** New features must include unit tests.

---

## License & Credits

**Project:** Neural Network Playground
**Course:** SE101 - Introduction to Methods of Software Engineering
**Institution:** University of Waterloo
**Term:** Fall 2025
**Team:** Team 8

**Team Members:**
- Yi Xing
- Sicheng Ouyang
- David Estrine
- Kevin Yan
- Ario Ostovary
