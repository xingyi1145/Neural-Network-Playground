# Requirements Document: Neural Network Playground

## 1. Functional Requirements

### 1.1 Dataset Management
- **FR-1.1**: System shall provide 5 curated datasets with registry-based architecture:
  - **MNIST**: 784 features (28x28 grayscale), 60K samples, classification, epochs=10, LR=0.001, batch=64
  - **Iris**: 4 features, 150 samples, classification, epochs=50, LR=0.01, batch=16
  - **California Housing**: 8 features, 20K samples, regression, epochs=20, LR=0.001, batch=32
  - **Wine Quality**: 11 features, 1.6K samples, classification, epochs=30, LR=0.001, batch=32
  - **Synthetic**: 2 features (XOR/Spiral), 500-1K samples (default 1K), classification, epochs=100, LR=0.01, batch=32
- **FR-1.2**: System shall display dataset metadata via `GET /api/datasets` (id, name, task_type, description, num_samples, num_features, hyperparameters)
- **FR-1.3**: System shall allow previewing sample data via `GET /api/datasets/{id}/preview` (1-100 samples, returns features and labels)
- **FR-1.4**: All datasets shall use StandardScaler normalization (except MNIST which uses /255.0) and ensure float32 dtype with NaN validation. All datasets use Adam optimizer (PyTorch default).
- **FR-1.5**: Datasets shall use train_test_split with test_size=0.2, random_state=42, stratify for classification tasks
- **FR-1.6**: Synthetic dataset shall support both "xor" and "spiral" generation modes via constructor parameter

### 1.2 Model Building
- **FR-2.1**: System shall provide visual drag-and-drop interface using React Flow
- **FR-2.2**: System shall support layer types: input (no activation), hidden (ReLU/Sigmoid/Tanh), output (Softmax for classification, linear for regression)
- **FR-2.3**: System shall allow configuration of neurons per layer and activation functions
- **FR-2.4**: System shall validate architecture (input neurons match dataset features, output neurons match classes/regression target)
- **FR-2.5**: System shall provide 10 pre-built templates (2 per dataset) via `GET /api/templates`:
  - **MNIST**: Simple (784→128→10) and Deep (784→256→128→10)
  - **Iris**: Simple (4→16→3) and Deep (4→32→16→3)
  - **California Housing**: Simple (8→32→1) and Deep (8→64→32→1)
  - **Wine Quality**: Simple (11→32→6) and Deep (11→64→32→6)
  - **Synthetic**: Simple (2→16→2) and Deep (2→32→16→2)
- **FR-2.6**: Templates shall be filterable by dataset_id via query parameter `GET /api/templates?dataset_id={id}`

### 1.3 Training System
- **FR-3.1**: System shall accept JSON model configuration via `POST /api/models` with layers array (type, neurons, activation, position)
- **FR-3.2**: Backend shall construct PyTorch models dynamically from JSON using parameterized model.py
- **FR-3.3**: System shall provide real-time training updates via `GET /api/training/{session_id}/status` (polling or WebSocket)
- **FR-3.4**: Training shall complete in <5 minutes per dataset on CPU using pre-configured hyperparameters
- **FR-3.5**: System shall support early stopping via `POST /api/training/{session_id}/stop`

### 1.4 Testing & Evaluation
- **FR-4.1**: System shall evaluate models via `POST /api/models/{id}/test` returning accuracy, loss, and metrics
- **FR-4.2**: Frontend shall display test results using Recharts visualizations
- **FR-4.3**: System shall show loss/accuracy curves during and after training

### 1.5 Error Handling
- **FR-5.1**: System shall return HTTP 404 for invalid dataset/template IDs with clear error messages
- **FR-5.2**: System shall handle training failures with HTTP 500 and user-friendly error details
- **FR-5.3**: Backend shall use global exception handler for consistent error responses (JSON format with detail field)

### 1.6 Educational Content
- **FR-6.1**: System shall provide 1-2 interactive tutorials with step-by-step guidance
- **FR-6.2**: System shall include tooltips explaining layers, neurons, activations, and training concepts

## 2. Technical Requirements

### 2.1 Backend Architecture
- **TR-1**: Backend shall use FastAPI 0.104.1 with uvicorn 0.24.0 server
- **TR-2**: Backend shall use PyTorch 2.1.0 for neural network training with dynamic graph construction
- **TR-3**: Backend shall implement dataset registry pattern (`register_dataset` decorator) for extensible dataset management
- **TR-4**: Backend shall use BaseDataset abstract class with `load()` method returning (X_train, y_train, X_test, y_test) as numpy arrays
- **TR-5**: Backend shall use scikit-learn 1.3.2 for data preprocessing (StandardScaler, train_test_split)
- **TR-6**: Backend shall use Pydantic BaseSettings for configuration management
- **TR-7**: Backend shall configure CORS for `http://localhost:5173` (Vite dev server) and `http://localhost:3000` (React dev server)

### 2.2 Frontend Architecture
- **TR-8**: Frontend shall use React 18.x with Vite build tool
- **TR-9**: Frontend shall use React Flow for drag-and-drop visual builder
- **TR-10**: Frontend shall use Recharts for training visualization (loss/accuracy curves)
- **TR-11**: Frontend shall use React Context API for state management (Zustand optional if needed)

### 2.3 API Endpoints (REST)
- **TR-12**: Dataset endpoints:
  - `GET /api/datasets` - Returns list of all datasets with metadata
  - `GET /api/datasets/{id}` - Returns detailed dataset info including input_shape and output_shape
  - `GET /api/datasets/{id}/preview?num_samples=N` - Returns preview (1-100 samples)
- **TR-13**: Template endpoints:
  - `GET /api/templates` - Returns all templates
  - `GET /api/templates?dataset_id={id}` - Filters templates by dataset
  - `GET /api/templates/{id}` - Returns specific template with layer configuration
- **TR-14**: Model endpoints (to be implemented):
  - `POST /api/models` - Create model from layer configuration (JSON)
  - `GET /api/models/{id}` - Get model details
  - `POST /api/models/{id}/train` - Start training session
  - `POST /api/models/{id}/test` - Test trained model
- **TR-15**: Training endpoints (to be implemented):
  - `GET /api/training/{session_id}/status` - Poll training progress
  - `POST /api/training/{session_id}/stop` - Stop training
- **TR-16**: Health endpoint: `GET /health` returning `{"status": "healthy"}`
- **TR-17**: Root endpoint: `GET /` returning API information with message, docs path, and available endpoints

### 2.4 Data Processing
- **TR-18**: All datasets shall normalize features using StandardScaler (except MNIST which uses /255.0)
- **TR-19**: All datasets shall use train_test_split with test_size=0.2, random_state=42, stratify for classification
- **TR-20**: All arrays shall be converted to float32 dtype with NaN validation before returning
- **TR-21**: Dataset previews shall limit to 100 samples maximum (enforced via Query parameter validation)
- **TR-22**: Datasets shall support optional max_samples parameter for limiting data size during development

### 2.5 Testing Requirements
- **TR-23**: Backend shall have pytest 7.4.3 tests for all API endpoints (datasets, templates, health)
- **TR-24**: Tests shall use FastAPI TestClient (httpx 0.25.1) for endpoint validation
- **TR-25**: Backend code coverage shall be >50% for critical paths (dataset loading, API routes)
- **TR-26**: Tests shall verify response formats, status codes (200, 404), and error handling
- **TR-27**: Tests shall validate template structure (layer count, neuron counts, activation functions)

### 2.6 Performance Requirements
- **TR-28**: Training shall complete in <5 minutes per dataset on CPU (using pre-configured hyperparameters)
- **TR-29**: UI interactions shall respond in <500ms
- **TR-30**: System shall use <4GB RAM during training
- **TR-31**: Dataset previews shall return within 1 second for up to 100 samples

### 2.7 Quality Requirements
- **TR-32**: System shall support Chrome and Firefox browsers (primary), Safari/Edge best-effort
- **TR-33**: Code shall follow Python style guidelines (black 23.11.0, flake8 6.1.0, isort 5.12.0)
- **TR-34**: Backend shall use proper HTTP status codes (200, 404, 500) for all responses

## 3. Non-Functional Requirements

### 3.1 Usability
- **NFR-1**: New users shall complete full workflow (select dataset → build → train → test) in <15 minutes
- **NFR-2**: Interface shall be 100% visual with no code viewing or editing
- **NFR-3**: Error messages shall be clear, actionable, and include HTTP status codes

### 3.2 Reliability
- **NFR-4**: System shall not crash during normal operation
- **NFR-5**: System shall validate all inputs (dataset IDs, layer configurations, preview sample counts)
- **NFR-6**: System shall handle missing datasets gracefully with 404 responses

### 3.3 Maintainability
- **NFR-7**: Code shall follow consistent style and include docstrings
- **NFR-8**: API endpoints shall be well-documented (FastAPI auto-docs at /docs)
- **NFR-9**: Dataset classes shall be registered via decorator pattern for easy extension

## 4. Constraints

- **C-1**: Timeline: 23-day development window (Nov 2-24, 2025)
- **C-2**: Scope: MLP architectures only (no CNNs, RNNs, Transformers)
- **C-3**: Interface: Visual-only, no code viewing/editing
- **C-4**: Hyperparameters: Pre-configured per dataset, users cannot modify
- **C-5**: Deployment: Local development only (Vite dev server + uvicorn), no cloud infrastructure
- **C-6**: Hardware: CPU-only training on standard laptops
- **C-7**: Dependencies: Python 3.8+, Node.js 18+ (for frontend)

## 5. Out of Scope

- Custom dataset uploads or data preprocessing UI
- User-adjustable hyperparameters (learning rate, batch size, epochs)
- Code viewing, editing, or export features
- Advanced architectures (CNNs, RNNs, attention mechanisms)
- User accounts, authentication, or cloud persistence
- Model export/sharing (.pth, ONNX files)
- Cloud deployment or production hosting
- Mobile app or responsive mobile design
- Integration with external platforms (TensorBoard, MLflow)

