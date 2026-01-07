# Neural Network Playground - Frontend Implementation Plan

## Overview
Single-page UI for building, training, and testing neural networks with an intuitive visual interface.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Neural Network Playground                │
├──────────────┬────────────────────────────┬─────────────────┤
│              │                            │                 │
│   Dataset    │                            │   Testing       │
│   Selector   │      Model Canvas          │   Panel         │
│              │   (ReactFlow Diagram)      │                 │
│   ● Circle   │                            │                 │
│   ● Circle   │   ┌────┐  ┌────┐  ┌────┐   │  Input: ____    │
│   ● Circle   │   │    │  │    │  │    │   │  [Test Model]   │
│   (active)   │   │ L1 │→ │ L2 │→ │ L3 │   │                 │
│              │   │    │  │    │  │    │   │  Output: ___    │
│              │   └────┘  └────┘  └────┘   │                 │
│              │                            ├─────────────────┤
│              │   [Add Layer +]            │                 │
│              │                            │  Training       │
│              │                            │  Panel          │
│              │                            │                 │
│              │                            │  [Train Button] │
│              │                            │  Epochs: ___    │
│              │                            │  Learning: ___  │
│              │                            │                 │
│              │                            │  Loss Graph:    │
│              │                            │    ╱╲           │
│              │                            │   ╱  ╲___       │
└──────────────┴────────────────────────────┴─────────────────┘
```

## Component Architecture

### 1. Main Page Component
**File**: `src/frontend/src/pages/Playground.jsx`
- Orchestrates all child components
- Manages grid layout with CSS Grid/Flexbox
- Proportions:
  - Dataset Selector: 15-20% width
  - Model Canvas: 50-55% width
  - Right Panel (Testing + Training): 25-30% width

### 2. DatasetSelector Component
**File**: `src/frontend/src/components/DatasetSelector.jsx`

**Features**:
- List of available datasets (fetched from API)
- Visual indicators (circles) showing:
  - Empty circle: Not selected
  - Filled green circle: Currently selected
  - Red/other color: Error or unavailable
- Display dataset metadata (samples, features, labels)
- Click to select/activate dataset

**API Integration**:
```javascript
GET /api/datasets - Fetch available datasets
GET /api/datasets/{id} - Get dataset details
```

### 3. ModelCanvas Component
**File**: `src/frontend/src/components/ModelCanvas.jsx`

**Features**:
- Uses ReactFlow for node-based model visualization
- Input node (from dataset) on the left
- Hidden layers in the middle (configurable)
- Output node on the right
- Edge connections between layers
- Interactive: click layers to edit, drag to reorder

**Custom Nodes**:
- InputNode: Shows input dimensions
- LayerNode: Shows layer type (Dense, Conv, etc.) and parameters
- OutputNode: Shows output dimensions

**Controls**:
- Add Layer button (floating or bottom)
- Layer configuration panel (opens on click)
- Delete layer option

### 4. LayerNode Component
**File**: `src/frontend/src/components/LayerNode.jsx`

**Features**:
- Visual representation of a neural network layer
- Displays: Layer type, number of neurons, activation function
- Color-coded by layer type
- Click to open configuration modal/panel

### 5. LayerConfigModal Component
**File**: `src/frontend/src/components/LayerConfigModal.jsx`

**Features**:
- Form for editing layer properties:
  - Layer type (Dense, Conv2D, Dropout, etc.)
  - Number of units/filters
  - Activation function
  - Other type-specific parameters
- Save/Cancel buttons

### 6. TestingPanel Component
**File**: `src/frontend/src/components/TestingPanel.jsx`

**Features**:
- Input area for test data
  - Text input for single values
  - Or upload test file
- "Test Model" button
- Output display area showing predictions
- Confidence scores (if classification)
- Visualization of results

**API Integration**:
```javascript
POST /api/models/{id}/test - Test model with input data
```

### 7. TrainingPanel Component
**File**: `src/frontend/src/components/TrainingPanel.jsx`

**Features**:
- Training controls:
  - Start/Stop training button
  - Epochs input
  - Learning rate input
  - Batch size input
  - Optimizer selection
- Real-time training statistics:
  - Current epoch
  - Training loss
  - Validation loss
  - Accuracy metrics
- Loss graph using Recharts (LineChart)
  - X-axis: Epoch number
  - Y-axis: Loss value
  - Two lines: Training loss vs Validation loss

**API Integration**:
```javascript
POST /api/models/train - Start training
GET /api/training/{id}/status - Poll for training status
GET /api/training/{id}/metrics - Get training metrics
```

### 8. LossGraph Component
**File**: `src/frontend/src/components/LossGraph.jsx`

**Features**:
- Recharts LineChart component
- Displays training and validation loss over epochs
- Interactive tooltips showing exact values
- Responsive to container size

## State Management

### Context: ModelContext
**File**: `src/frontend/src/context/ModelContext.jsx`

**State**:
```javascript
{
  selectedDataset: null,
  model: {
    layers: [],
    architecture: {}
  },
  training: {
    isTraining: false,
    currentEpoch: 0,
    metrics: {
      loss: [],
      accuracy: [],
      valLoss: [],
      valAccuracy: []
    }
  },
  testing: {
    inputs: null,
    outputs: null
  }
}
```

**Actions**:
- `selectDataset(datasetId)`
- `addLayer(layerConfig)`
- `updateLayer(layerId, config)`
- `removeLayer(layerId)`
- `startTraining(config)`
- `stopTraining()`
- `updateTrainingMetrics(metrics)`
- `testModel(inputs)`

## API Service Layer

### File: `src/frontend/src/services/modelApi.js`

**Functions**:
```javascript
// Datasets
export const fetchDatasets = async () => { ... }
export const fetchDatasetById = async (id) => { ... }

// Model operations
export const createModel = async (architecture) => { ... }
export const updateModel = async (id, architecture) => { ... }
export const deleteModel = async (id) => { ... }

// Training
export const startTraining = async (modelId, config) => { ... }
export const getTrainingStatus = async (trainingId) => { ... }
export const getTrainingMetrics = async (trainingId) => { ... }
export const stopTraining = async (trainingId) => { ... }

// Testing
export const testModel = async (modelId, inputs) => { ... }
```

## Styling Strategy

### Tailwind Classes
- Use CSS Grid for main layout
- Flexbox for component internals
- Consistent spacing: `p-4`, `gap-4`, `m-2`
- Color scheme:
  - Background: `bg-gray-50`, `bg-white`
  - Primary: `bg-blue-500`, `hover:bg-blue-600`
  - Success: `bg-green-500`
  - Error: `bg-red-500`
  - Borders: `border-gray-200`, `border-gray-300`

### Custom CSS (if needed)
**File**: `src/frontend/src/styles/playground.css`
- ReactFlow custom node styles
- Graph animations
- Custom scrollbars

## ReactFlow Configuration

### Node Types
```javascript
const nodeTypes = {
  input: InputNode,
  layer: LayerNode,
  output: OutputNode
}
```

### Edge Configuration
```javascript
const edgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#3b82f6', strokeWidth: 2 }
}
```

### Layout Algorithm
- Use `dagre` or manual positioning for left-to-right flow
- Input node: x=50, y=center
- Output node: x=800, y=center
- Layers distributed evenly between

## Implementation Order

1. Set up ModelContext with basic state
2. Create Playground page with grid layout
3. Build DatasetSelector (static first, then API)
4. Build basic ModelCanvas with ReactFlow
5. Create LayerNode component
6. Add layer configuration functionality
7. Build TestingPanel (UI first)
8. Build TrainingPanel (UI first)
9. Add LossGraph with mock data
10. Integrate all API calls
11. Add real-time training updates (polling or websockets)
12. Polish styling and responsiveness
13. Add error handling and loading states

## Technical Considerations

### Performance
- Lazy load Recharts to reduce initial bundle size
- Debounce layer configuration changes
- Use React.memo for heavy components
- Virtual scrolling for large datasets list

### User Experience
- Loading spinners for async operations
- Smooth transitions between states
- Keyboard shortcuts for common actions
- Undo/redo for model changes (future enhancement)

### Error Handling
- Toast notifications for errors
- Validation before training starts
- Graceful degradation if API is unavailable
- Clear error messages in UI

### Accessibility
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly

## Future Enhancements (Out of Scope for MVP)
- Save/load model architectures
- Model comparison view
- Export trained models
- Advanced visualizations (layer activations, gradients)
- Real-time collaboration
- Model templates/presets
