import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAppStore } from '@lib/stores/app-store'
import { GoogleIntegration } from '@features/integrations/components/google-integration'

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>
const mockOnRefresh = jest.fn()

const mockIntegrations = [
  {
    id: 'integration-1',
    authMethod: 'oauth' as const,
    name: 'John Doe',
    email: 'john@example.com',
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
    lastUsed: new Date('2024-01-01'),
    createdAt: new Date('2023-12-01'),
  },
  {
    id: 'integration-2',
    authMethod: 'service_account' as const,
    name: 'Service Account',
    email: 'service@project.iam.gserviceaccount.com',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    createdAt: new Date('2023-11-01'),
  },
]

global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: '' },
})

describe('GoogleIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAppStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      currentOrg: { id: 'org-1', name: 'Test Org' },
      organizations: [],
      setCurrentOrg: jest.fn(),
      setUser: jest.fn(),
      clearAuth: jest.fn(),
    })
    mockFetch.mockClear()
  })

  it('renders integration list correctly', () => {
    render(
      <GoogleIntegration
        integrations={mockIntegrations}
        onRefresh={mockOnRefresh}
        isAdmin={true}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Service Account')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('service@project.iam.gserviceaccount.com')).toBeInTheDocument()
  })

  it('shows OAuth and Service Account tabs', () => {
    render(
      <GoogleIntegration
        integrations={[]}
        onRefresh={mockOnRefresh}
        isAdmin={true}
      />
    )

    expect(screen.getByText('User OAuth')).toBeInTheDocument()
    expect(screen.getByText('Service Account')).toBeInTheDocument()
  })

  it('handles OAuth connection', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        authUrl: 'https://accounts.google.com/oauth/authorize?...',
      }),
    } as Response)

    render(
      <GoogleIntegration
        integrations={[]}
        onRefresh={mockOnRefresh}
        isAdmin={true}
      />
    )

    const connectButton = screen.getByText('Connect with Google')
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/integrations/google/auth?orgId=org-1&scopes=spreadsheets,drive.file',
        { method: 'GET' }
      )
      expect(window.location.href).toBe('https://accounts.google.com/oauth/authorize?...')
    })
  })

  it('handles OAuth connection error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid request' }),
    } as Response)

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(
      <GoogleIntegration
        integrations={[]}
        onRefresh={mockOnRefresh}
        isAdmin={true}
      />
    )

    const connectButton = screen.getByText('Connect with Google')
    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to connect to Google. Please try again.')
    })

    alertSpy.mockRestore()
  })

  it('handles service account form submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response)

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(
      <GoogleIntegration
        integrations={[]}
        onRefresh={mockOnRefresh}
        isAdmin={true}
      />
    )

    // Switch to service account tab
    fireEvent.click(screen.getByText('Service Account'))

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Integration Name'), {
      target: { value: 'My Service Account' },
    })

    const credentialsTextarea = screen.getByLabelText('Service Account Credentials (JSON)')
    fireEvent.change(credentialsTextarea, {
      target: {
        value: JSON.stringify({
          type: 'service_account',
          project_id: 'test-project',
          private_key_id: 'key-id',
          private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
          client_email: 'service@test-project.iam.gserviceaccount.com',
          client_id: '123456789',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
        }),
      },
    })

    fireEvent.click(screen.getByText('Set Up Service Account'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/integrations/google/service-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"orgId":"org-1"'),
      })
      expect(alertSpy).toHaveBeenCalledWith('✅ Service account integration set up successfully!')
      expect(mockOnRefresh).toHaveBeenCalled()
    })

    alertSpy.mockRestore()
  })

  it('handles service account form validation error', async () => {
    render(
      <GoogleIntegration
        integrations={[]}
        onRefresh={mockOnRefresh}
        isAdmin={true}
      />
    )

    // Switch to service account tab
    fireEvent.click(screen.getByText('Service Account'))

    // Try to submit with invalid JSON
    fireEvent.change(screen.getByLabelText('Integration Name'), {
      target: { value: 'My Service Account' },
    })

    fireEvent.change(screen.getByLabelText('Service Account Credentials (JSON)'), {
      target: { value: 'invalid json' },
    })

    fireEvent.click(screen.getByText('Set Up Service Account'))

    await waitFor(() => {
      expect(screen.getByText('Invalid JSON format for credentials')).toBeInTheDocument()
    })
  })

  it('handles file upload for credentials', () => {
    render(
      <GoogleIntegration
        integrations={[]}
        onRefresh={mockOnRefresh}
        isAdmin={true}
      />
    )

    // Switch to service account tab
    fireEvent.click(screen.getByText('Service Account'))

    const fileInput = screen.getByLabelText('Upload JSON File')
    const file = new File(['{"test": "data"}'], 'credentials.json', {
      type: 'application/json',
    })

    fireEvent.change(fileInput, { target: { files: [file] } })

    // File content should be loaded into textarea
    expect(screen.getByLabelText('Service Account Credentials (JSON)')).toHaveValue('{"test": "data"}')
  })

  it('shows admin-only features for admins', () => {
    render(
      <GoogleIntegration
        integrations={[]}
        onRefresh={mockOnRefresh}
        isAdmin={true}
      />
    )

    expect(screen.getByText('Connect with Google')).toBeInTheDocument()
    expect(screen.getByText('Service Account')).toBeInTheDocument()
  })

  it('hides admin features for non-admins', () => {
    render(
      <GoogleIntegration
        integrations={mockIntegrations}
        onRefresh={mockOnRefresh}
        isAdmin={false}
      />
    )

    expect(screen.queryByText('Connect with Google')).not.toBeInTheDocument()
    expect(screen.getByText('Google integration has not been configured yet.')).toBeInTheDocument()
    expect(screen.getByText('Ask your organization administrator to set up Google integration.')).toBeInTheDocument()
  })

  it('displays integration scopes correctly', () => {
    render(
      <GoogleIntegration
        integrations={mockIntegrations}
        onRefresh={mockOnRefresh}
        isAdmin={false}
      />
    )

    expect(screen.getByText(/Google Sheets \(Read\/Write\)/)).toBeInTheDocument()
    expect(screen.getByText(/Google Drive \(App Files\)/)).toBeInTheDocument()
  })

  it('handles integration disconnection', async () => {
    render(
      <GoogleIntegration
        integrations={mockIntegrations}
        onRefresh={mockOnRefresh}
        isAdmin={true}
      />
    )

    const disconnectButtons = screen.getAllByText('Disconnect')
    fireEvent.click(disconnectButtons[0])

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled()
    })
  })

  it('shows loading states correctly', () => {
    render(
      <GoogleIntegration
        integrations={[]}
        onRefresh={mockOnRefresh}
        isAdmin={true}
      />
    )

    const connectButton = screen.getByText('Connect with Google')
    fireEvent.click(connectButton)

    expect(screen.getByText('Connecting...')).toBeInTheDocument()
  })
}) 