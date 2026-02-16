import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import App from '../../src/frontend/src/App'

// Mock the modelApi service
vi.mock('../../src/frontend/src/services/modelApi', () => ({
  fetchDatasets: vi.fn(),
  createModel: vi.fn(),
  getModel: vi.fn(),
  updateModel: vi.fn(),
  deleteModel: vi.fn(),
  listModels: vi.fn(),
  startTraining: vi.fn(),
  getTrainingStatus: vi.fn(),
  getTrainingMetrics: vi.fn(),
  stopTraining: vi.fn(),
  pauseTraining: vi.fn(),
  resumeTraining: vi.fn(),
  getTrainingHistory: vi.fn(),
  testModel: vi.fn(),
  evaluateModel: vi.fn(),
  exportModel: vi.fn(),
  importModel: vi.fn(),
}))

import { fetchDatasets } from '../../src/frontend/src/services/modelApi'

describe('App', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    // Default mock implementation for fetchDatasets
    fetchDatasets.mockResolvedValue([
      { id: '1', name: 'Iris', num_samples: 150, num_features: 4, task_type: 'classification' },
      { id: '2', name: 'MNIST', num_samples: 60000, num_features: 784, task_type: 'classification' }
    ])
  })

  it('renders the main application layout', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    
    // Check for main header
    expect(await screen.findByText('nurel')).toBeInTheDocument()
    expect(screen.getByText('Neural network playground')).toBeInTheDocument()
    
    // Check for workflow steps and panel headings
    expect(screen.getByText('Select Dataset')).toBeInTheDocument()
    expect(screen.getByText('Build Model')).toBeInTheDocument()

    // "Train" and "Test" appear in both the header stepper and right panel tabs
    expect(screen.getAllByText('Train').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Test').length).toBeGreaterThanOrEqual(1)
  })

  it('loads and displays datasets', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    
    // Wait for datasets to be loaded and displayed
    expect(await screen.findByText('Iris')).toBeInTheDocument()
    expect(screen.getByText('MNIST')).toBeInTheDocument()
  })
})
