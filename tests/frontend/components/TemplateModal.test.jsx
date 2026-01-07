import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TemplateModal from '../../../src/frontend/src/components/TemplateModal'
import * as modelsAPI from '../../../src/frontend/src/api/models'

// Mock API
vi.mock('../../../src/frontend/src/api/models', () => ({
  getTemplates: vi.fn(),
}))

describe('TemplateModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when isOpen is false', () => {
    render(
      <TemplateModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onSelect={mockOnSelect} 
      />
    )
    
    expect(screen.queryByText('Load Template')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', async () => {
    modelsAPI.getTemplates.mockResolvedValue([])
    
    render(
      <TemplateModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSelect={mockOnSelect} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Load Template')).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching templates', async () => {
    modelsAPI.getTemplates.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(
      <TemplateModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSelect={mockOnSelect} 
      />
    )
    
    expect(screen.getByText('Loading templates...')).toBeInTheDocument()
  })

  it('displays templates when loaded', async () => {
    const mockTemplates = [
      { id: 1, name: 'Template 1', description: 'First template', layers: [] },
      { id: 2, name: 'Template 2', description: 'Second template', layers: [] }
    ]
    modelsAPI.getTemplates.mockResolvedValue(mockTemplates)
    
    render(
      <TemplateModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSelect={mockOnSelect} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Template 1')).toBeInTheDocument()
      expect(screen.getByText('Template 2')).toBeInTheDocument()
      expect(screen.getByText('First template')).toBeInTheDocument()
      expect(screen.getByText('Second template')).toBeInTheDocument()
    })
  })

  it('shows message when no templates found', async () => {
    modelsAPI.getTemplates.mockResolvedValue([])
    
    render(
      <TemplateModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSelect={mockOnSelect} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('No templates found.')).toBeInTheDocument()
    })
  })

  it('calls onSelect when template is clicked', async () => {
    const user = userEvent.setup()
    const mockTemplate = { id: 1, name: 'Template 1', description: 'Test', layers: [] }
    modelsAPI.getTemplates.mockResolvedValue([mockTemplate])
    
    render(
      <TemplateModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSelect={mockOnSelect} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Template 1')).toBeInTheDocument()
    })
    
    const templateElement = screen.getByText('Template 1').closest('div')
    await user.click(templateElement)
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockTemplate)
  })

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    modelsAPI.getTemplates.mockResolvedValue([])
    
    render(
      <TemplateModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSelect={mockOnSelect} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('handles API errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    modelsAPI.getTemplates.mockRejectedValue(new Error('API Error'))
    
    render(
      <TemplateModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSelect={mockOnSelect} 
      />
    )
    
    await waitFor(() => {
      expect(modelsAPI.getTemplates).toHaveBeenCalled()
    })
    
    // Should not crash, just log error
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
