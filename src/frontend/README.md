# Neural Network Playground - Frontend

A single-page React application for building, training, and testing neural networks with an intuitive visual interface.

## Features

### 1. Dataset Selection (Left Panel)
- Visual list of available datasets with status indicators
- Green circle for selected dataset
- Dataset metadata display (samples, features, type)
- Upload new datasets

### 2. Model Canvas (Center Panel)
- Visual neural network builder using ReactFlow
- Interactive layer nodes with edit/delete controls
- Input and output nodes automatically configured
- Add layers via modal with full configuration
- Supports: Dense, Conv2D, MaxPooling2D, Dropout, Flatten layers

### 3. Testing Panel (Top Right)
- Input area for test data
- Real-time predictions display
- Confidence scores and class probabilities visualization

### 4. Training Panel (Bottom Right)
- Configurable training parameters (epochs, learning rate, batch size, optimizer)
- Real-time training progress display
- Interactive loss/accuracy graph using Recharts
- Start/Stop/Reset controls

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── DatasetSelector.jsx      # Dataset list and selection
│   ├── ModelCanvas.jsx           # ReactFlow model builder
│   ├── LayerNode.jsx             # Custom layer node component
│   ├── InputNode.jsx             # Input layer node
│   ├── OutputNode.jsx            # Output layer node
│   ├── LayerConfigModal.jsx     # Layer configuration form
│   ├── TestingPanel.jsx          # Model testing interface
│   ├── TrainingPanel.jsx         # Training controls and status
│   └── LossGraph.jsx             # Recharts loss/accuracy graph
├── context/
│   └── ModelContext.jsx          # Global state management
├── pages/
│   └── Playground.jsx            # Main single-page layout
├── services/
│   ├── api.js                    # Axios instance
│   └── modelApi.js               # API service functions
├── hooks/                        # Custom React hooks
├── types/                        # Type definitions
├── App.jsx                       # Main app component with routing
├── main.jsx                      # React entry point
└── index.css                     # Global styles with Tailwind CSS
```

## Dependencies

- **React 18.x** - UI framework
- **React Router** - Client-side routing
- **React Flow** - Node-based visual builder for model architecture
- **Recharts** - Interactive training graphs
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls

## State Management

Uses React Context API (`ModelContext`) to manage:
- Selected dataset
- Model architecture (layers)
- Training state and metrics
- Testing inputs/outputs

Access state via `useModel()` hook in any component.

## Configuration

### Vite Proxy

The Vite dev server is configured to proxy API calls to the backend:
- All requests to `/api/*` are proxied to `http://localhost:8000`
- This handles CORS issues during development

Configuration is in `vite.config.js`.

### Tailwind CSS

Tailwind CSS is configured and ready to use. Import styles in `src/index.css`.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Integration

The frontend expects these API endpoints:

**Datasets:** GET/POST `/api/datasets`, GET `/api/datasets/:id`
**Models:** POST/GET/PUT/DELETE `/api/models/:id`
**Training:** POST `/api/models/:id/train`, GET `/api/training/:id/status`
**Testing:** POST `/api/models/:id/predict`

See [FRONTEND_PLAN.md](../../FRONTEND_PLAN.md) for detailed API specifications.

