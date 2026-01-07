import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModelBuilder from '../../../src/frontend/src/pages/ModelBuilder'
import * as modelsAPI from '../../../src/frontend/src/api/models'

// Mock ReactFlow
vi.mock('reactflow', () => {
  const MockReactFlow = ({ children }) => <div data-testid="react-flow">{children}</div>
  const MockReactFlowProvider = ({ children }) => <div>{children}</div>
  const MockBackground = () => <div data-testid="background" />
  const MockControls = () => <div data-testid="controls" />
  const MockMiniMap = () => <div data-testid="minimap" />
  
  return {
    default: MockReactFlow,
    useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
    useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
    addEdge: vi.fn((params) => params),
    ReactFlowProvider: MockReactFlowProvider,
    ReactFlow: MockReactFlow,
    Background: MockBackground,
    Controls: MockControls,
    MiniMap: MockMiniMap,
  }
})

// Mock API
vi.mock('../../../src/frontend/src/api/models', () => ({
  createModel: vi.fn(),
  getTemplates: vi.fn(),
}))

describe('ModelBuilder', () => {
  const mockOnNavigateToTraining = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    modelsAPI.getTemplates.mockResolvedValue([])
  })

  it('renders ModelBuilder with header', () => {
    render(<ModelBuilder onNavigateToTraining={mockOnNavigateToTraining} />)
    
    expect(screen.getByText('Model Builder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load template/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create model/i })).toBeInTheDocument()
  })

  it('renders model name input with default value', () => {
    render(<ModelBuilder onNavigateToTraining={mockOnNavigateToTraining} />)
    
    const nameInput = screen.getByDisplayValue('My Model')
    expect(nameInput).toBeInTheDocument()
  })

  it('allows changing model name', async () => {
    const user = userEvent.setup()
    render(<ModelBuilder onNavigateToTraining={mockOnNavigateToTraining} />)
    
    const nameInput = screen.getByDisplayValue('My Model')
    await user.clear(nameInput)
    await user.type(nameInput, 'New Model Name')
    
    expect(nameInput).toHaveValue('New Model Name')
  })

  it('opens template modal when Load Template button is clicked', async () => {
    const user = userEvent.setup()
    modelsAPI.getTemplates.mockResolvedValue([
      { id: 1, name: 'Template 1', description: 'Test template', layers: [] }
    ])
    
    render(<ModelBuilder onNavigateToTraining={mockOnNavigateToTraining} />)
    
    const loadButton = screen.getByRole('button', { name: /load template/i })
    await user.click(loadButton)
    
    // Wait for modal to appear - check for Cancel button which is unique to modal
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  it('renders LayerPalette and Canvas', () => {
    render(<ModelBuilder onNavigateToTraining={mockOnNavigateToTraining} />)
    
    expect(screen.getByText('Layer Palette')).toBeInTheDocument()
    // ReactFlow renders a wrapper with this test id
    expect(screen.getByTestId('rf__wrapper')).toBeInTheDocument()
  })

  it('renders ConfigPanel', () => {
    render(<ModelBuilder onNavigateToTraining={mockOnNavigateToTraining} />)
    
    expect(screen.getByText('Select a layer to configure')).toBeInTheDocument()
  })
})
