import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LayerPalette from '../../../src/frontend/src/components/LayerPalette'

describe('LayerPalette', () => {
  it('renders all layer types', () => {
    render(<LayerPalette />)
    
    expect(screen.getByText('Layer Palette')).toBeInTheDocument()
    expect(screen.getByText('Linear Layer')).toBeInTheDocument()
    expect(screen.getByText('ReLU Activation')).toBeInTheDocument()
    expect(screen.getByText('Conv2d Layer')).toBeInTheDocument()
    expect(screen.getByText('MaxPool2d')).toBeInTheDocument()
    expect(screen.getByText('Flatten')).toBeInTheDocument()
    expect(screen.getByText('Dropout')).toBeInTheDocument()
  })

  it('renders drag instruction', () => {
    render(<LayerPalette />)
    expect(screen.getByText(/Drag layers to the canvas/i)).toBeInTheDocument()
  })

  it('makes layer items draggable', () => {
    render(<LayerPalette />)
    const linearLayer = screen.getByText('Linear Layer').closest('div')
    expect(linearLayer).toHaveAttribute('draggable', 'true')
  })
})
