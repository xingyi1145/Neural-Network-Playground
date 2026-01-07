# API Endpoints Implementation

**Your responsibility**: Create REST API endpoints for the Neural Network Playground frontend.

## What You Created

### File Structure
```text
Project/
├── src/
│   ├── main.py                     # FastAPI app entry point
│   └── backend/
│       └── api/
│           ├── templates.py        # MNIST template definitions
│           └── routes/
│               ├── datasets.py     # Dataset API endpoints
│               └── templates.py    # Template API endpoints
└── tests/
    └── test_api.py                 # API endpoint tests
```

## API Endpoints You Implemented

### 1. Dataset Endpoints
Uses teammate's `backend.datasets` module for data access.

- **GET /api/datasets** - List all datasets with metadata
- **GET /api/datasets/{id}** - Get dataset details
- **GET /api/datasets/{id}/preview?num_samples=10** - Sample data preview

### 2. Template Endpoints
Uses templates you defined in `backend/api/templates.py`.

- **GET /api/templates** - List all templates (optional `?dataset_id=` filter)
- **GET /api/templates/{id}** - Get template details

## MNIST Templates You Created

### Simple MLP
```
Input(784) → Hidden(128, ReLU) → Output(10, Softmax)
```
- 3-layer basic network
- Good for quick experiments
- ID: `mnist_simple`

### Deep MLP
```
Input(784) → Hidden(256, ReLU) → Hidden(128, ReLU) → Output(10, Softmax)
```
- 4-layer deep network
- Better accuracy potential
- ID: `mnist_deep`

## Dependencies on Teammate's Work

Your API imports from:
- **`backend.datasets`** (teammate's dataset registry)
  - `get_dataset(id)` - Load dataset by ID
  - `list_datasets()` - Get all dataset IDs
  - `BaseDataset` - Dataset interface
- **Pydantic models** (assumed teammate created these)
  - `DatasetMetadata`
  - `DatasetPreview`
  - `Template`

## Running Your API

### 1. Install dependencies
```bash
pip install fastapi uvicorn pytest httpx
```

### 2. Start the server
```bash
cd Project/src
python main.py
```

Server runs at: http://localhost:8000

### 3. View API docs
Visit: http://localhost:8000/docs

### 4. Test your endpoints
```bash
cd Project/src
pytest tests/test_api.py -v
```

## Example API Calls

### List datasets
```bash
curl http://localhost:8000/api/datasets
```

### Get MNIST details
```bash
curl http://localhost:8000/api/datasets/mnist
```

### Preview 5 samples
```bash
curl "http://localhost:8000/api/datasets/mnist/preview?num_samples=5"
```

### List templates
```bash
curl http://localhost:8000/api/templates
```

### Get Simple MLP template
```bash
curl http://localhost:8000/api/templates/mnist_simple
```

## What You DON'T Need to Worry About

- Dataset loading logic (teammate handles this)
- Pydantic model definitions (teammate creates schemas)
- Data preprocessing (teammate's `BaseDataset.load()`)
- ML training code (Week 2 work)

## Your Scope

- API endpoint routing
- Request/response handling
- Template definitions (2 MNIST templates)
- API testing
- Documentation

## Testing Strategy

Your tests cover:
- All 5 API endpoints work
- Dataset listing and details
- Dataset preview with sample limits
- Template filtering by dataset
- Both MNIST templates return correct structure
- 404 errors for nonexistent resources
- Health check endpoint

## Next Steps (Week 2)

When you're ready to expand:
1. Add POST endpoints for model training
2. Add GET endpoints for training status
3. Add POST endpoints for model testing

But for now, focus on these 5 GET endpoints!
