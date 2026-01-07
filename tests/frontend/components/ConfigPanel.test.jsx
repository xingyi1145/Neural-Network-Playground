import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfigPanel from '../../../src/frontend/src/components/ConfigPanel'

describe('ConfigPanel', () => {
  it('renders placeholder when no node is selected', () => {
    render(<ConfigPanel selectedNode={null} onChange={vi.fn()} />)
    expect(screen.getByText('Select a layer to configure')).toBeInTheDocument()
  })

  it('renders configuration fields for Linear layer', () => {
    const mockNode = {
      id: 'node1',
      data: {
        type: 'Linear',
        label: 'Linear node',
        config: { in_features: 10, out_features: 20 }
      }
    }
    const onChange = vi.fn()
    
    render(<ConfigPanel selectedNode={mockNode} onChange={onChange} />)
    
    expect(screen.getByText(/Configuration: Linear node/i)).toBeInTheDocument()
    expect(screen.getByText(/In Features/i)).toBeInTheDocument()
    expect(screen.getByText(/Out Features/i)).toBeInTheDocument()
    // Check that inputs exist by their values
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()
  })

  it('renders configuration fields for Conv2d layer', () => {
    const mockNode = {
      id: 'node2',
      data: {
        type: 'Conv2d',
        label: 'Conv2d node',
        config: { in_channels: 3, out_channels: 16, kernel_size: 5 }
      }
    }
    const onChange = vi.fn()
    
    render(<ConfigPanel selectedNode={mockNode} onChange={onChange} />)
    
    expect(screen.getByText(/In Channels/i)).toBeInTheDocument()
    expect(screen.getByText(/Out Channels/i)).toBeInTheDocument()
    expect(screen.getByText(/Kernel Size/i)).toBeInTheDocument()
    // Check that inputs exist by their values (using getAllByDisplayValue since there might be multiple)
    const inputs = screen.getAllByDisplayValue('3')
    expect(inputs.length).toBeGreaterThan(0)
    expect(screen.getByDisplayValue('16')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('renders configuration fields for Dropout layer', () => {
    const mockNode = {
      id: 'node3',
      data: {
        type: 'Dropout',
        label: 'Dropout node',
        config: { p: 0.5 }
      }
    }
    const onChange = vi.fn()
    
    render(<ConfigPanel selectedNode={mockNode} onChange={onChange} />)
    
    expect(screen.getByText(/Probability/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('0.5')).toBeInTheDocument()
  })

  it('calls onChange when input values change', async () => {
    const user = userEvent.setup()
    const mockNode = {
      id: 'node1',
      data: {
        type: 'Linear',
        label: 'Linear node',
        config: { in_features: 10, out_features: 20 }
      }
    }
    const onChange = vi.fn()
    
    render(<ConfigPanel selectedNode={mockNode} onChange={onChange} />)
    
    // Find input by its value, then get the parent to find the input
    const inFeaturesInput = screen.getByDisplayValue('10')
    await user.clear(inFeaturesInput)
    await user.type(inFeaturesInput, '15')
    
    expect(onChange).toHaveBeenCalledWith('node1', expect.objectContaining({
      in_features: 15
    }))
  })

  it('displays current config values', () => {
    const mockNode = {
      id: 'node1',
      data: {
        type: 'Linear',
        label: 'Linear node',
        config: { in_features: 10, out_features: 20 }
      }
    }
    const onChange = vi.fn()
    
    render(<ConfigPanel selectedNode={mockNode} onChange={onChange} />)
    
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()
  })

  it('shows default message for unknown layer types', () => {
    const mockNode = {
      id: 'node4',
      data: {
        type: 'UnknownType',
        label: 'Unknown node',
        config: {}
      }
    }
    const onChange = vi.fn()
    
    render(<ConfigPanel selectedNode={mockNode} onChange={onChange} />)
    
    expect(screen.getByText(/No configuration for this layer type/i)).toBeInTheDocument()
  })
})
