import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Layout from '../../../src/frontend/src/components/Layout'

describe('Layout', () => {
  it('renders header content', () => {
    const headerContent = <div>Test Header</div>
    render(
      <Layout header={headerContent}>
        <div>Test Content</div>
      </Layout>
    )
    
    expect(screen.getByText('Test Header')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders children in main section', () => {
    render(
      <Layout header={<div>Header</div>}>
        <div>Main Content</div>
      </Layout>
    )
    
    expect(screen.getByText('Main Content')).toBeInTheDocument()
  })

  it('renders without header', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
