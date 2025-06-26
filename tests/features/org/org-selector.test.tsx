import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAppStore } from '@lib/stores/app-store'
import { OrgSelector } from '@features/org/components/org-selector'

const mockSetCurrentOrg = jest.fn()
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

const mockOrganizations = [
  {
    id: 'org-1',
    name: 'Acme Corp',
    subscriptionPlan: 'pro',
    currency: 'USD',
    role: 'admin',
  },
  {
    id: 'org-2',
    name: 'Tech Startup',
    subscriptionPlan: 'free',
    currency: 'USD',
    role: 'editor',
  },
  {
    id: 'org-3',
    name: 'Enterprise Inc',
    subscriptionPlan: 'enterprise',
    currency: 'EUR',
    role: 'viewer',
  },
]

describe('OrgSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAppStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      currentOrg: mockOrganizations[0],
      organizations: mockOrganizations,
      setCurrentOrg: mockSetCurrentOrg,
      setUser: jest.fn(),
      clearAuth: jest.fn(),
    })
  })

  it('renders current organization', () => {
    render(<OrgSelector />)
    
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Pro Plan')).toBeInTheDocument()
  })

  it('shows organization list when clicked', () => {
    render(<OrgSelector />)
    
    fireEvent.click(screen.getByTestId('org-selector-trigger'))
    
    expect(screen.getByText('Tech Startup')).toBeInTheDocument()
    expect(screen.getByText('Enterprise Inc')).toBeInTheDocument()
    expect(screen.getByText('Free Plan')).toBeInTheDocument()
    expect(screen.getByText('Enterprise Plan')).toBeInTheDocument()
  })

  it('switches organization when different org is selected', async () => {
    render(<OrgSelector />)
    
    fireEvent.click(screen.getByTestId('org-selector-trigger'))
    fireEvent.click(screen.getByText('Tech Startup'))
    
    await waitFor(() => {
      expect(mockSetCurrentOrg).toHaveBeenCalledWith(mockOrganizations[1])
    })
  })

  it('shows user role badges correctly', () => {
    render(<OrgSelector />)
    
    fireEvent.click(screen.getByTestId('org-selector-trigger'))
    
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
    expect(screen.getByText('Viewer')).toBeInTheDocument()
  })

  it('displays currency for each organization', () => {
    render(<OrgSelector />)
    
    fireEvent.click(screen.getByTestId('org-selector-trigger'))
    
    expect(screen.getAllByText('USD')).toHaveLength(2)
    expect(screen.getByText('EUR')).toBeInTheDocument()
  })

  it('shows create new organization option', () => {
    render(<OrgSelector />)
    
    fireEvent.click(screen.getByTestId('org-selector-trigger'))
    
    expect(screen.getByText('Create New Organization')).toBeInTheDocument()
  })

  it('handles empty organizations list', () => {
    mockUseAppStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      currentOrg: null,
      organizations: [],
      setCurrentOrg: mockSetCurrentOrg,
      setUser: jest.fn(),
      clearAuth: jest.fn(),
    })

    render(<OrgSelector />)
    
    expect(screen.getByText('No Organization Selected')).toBeInTheDocument()
  })

  it('shows current organization indicator', () => {
    render(<OrgSelector />)
    
    fireEvent.click(screen.getByTestId('org-selector-trigger'))
    
    // Current org should have a check mark or special styling
    const currentOrgItem = screen.getByTestId('org-item-org-1')
    expect(currentOrgItem).toHaveClass('bg-gray-50') // or whatever class indicates current
  })

  it('filters organizations by search term', () => {
    render(<OrgSelector />)
    
    fireEvent.click(screen.getByTestId('org-selector-trigger'))
    
    const searchInput = screen.getByPlaceholderText('Search organizations...')
    fireEvent.change(searchInput, { target: { value: 'Tech' } })
    
    expect(screen.getByText('Tech Startup')).toBeInTheDocument()
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
    expect(screen.queryByText('Enterprise Inc')).not.toBeInTheDocument()
  })

  it('handles keyboard navigation', () => {
    render(<OrgSelector />)
    
    fireEvent.click(screen.getByTestId('org-selector-trigger'))
    
    // Test arrow key navigation
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' })
    
    expect(mockSetCurrentOrg).toHaveBeenCalled()
  })

  it('closes selector when clicking outside', () => {
    render(<OrgSelector />)
    
    fireEvent.click(screen.getByTestId('org-selector-trigger'))
    expect(screen.getByText('Tech Startup')).toBeInTheDocument()
    
    fireEvent.click(document.body)
    
    // Selector should close
    expect(screen.queryByText('Tech Startup')).not.toBeInTheDocument()
  })
}) 