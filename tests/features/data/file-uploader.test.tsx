import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUploader } from '@features/data/components/file-uploader'

// Mock fetch for API calls
global.fetch = jest.fn()

const mockOnUploadSuccess = jest.fn()
const mockOnUploadError = jest.fn()

describe('FileUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders upload area correctly', () => {
    render(
      <FileUploader
        orgId="test-org"
        userId="test-user"
        onUploadSuccess={mockOnUploadSuccess}
        onUploadError={mockOnUploadError}
      />
    )

    expect(screen.getByText('Drag & drop your files here, or click to browse')).toBeInTheDocument()
    expect(screen.getByText('Supports CSV and Excel files up to 10MB each. Multiple files supported.')).toBeInTheDocument()
  })

  it('handles file selection via input', async () => {
    const user = userEvent.setup()
    
    // Mock successful upload response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        dataImportId: 'test-id', 
        data: [{ test: 'data' }], 
        headers: ['test', 'data']
      })
    })

    render(
      <FileUploader
        orgId="test-org"
        userId="test-user"
        onUploadSuccess={mockOnUploadSuccess}
        onUploadError={mockOnUploadError}
      />
    )

    const file = new File(['test,data\n1,2'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByRole('presentation').querySelector('input[type="file"]') as HTMLInputElement

    // Upload file using the hidden input
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/data/upload', expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      }))
    })
  })

  it('validates file size', async () => {
    const user = userEvent.setup()
    
    // Mock file size error response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'File size exceeds 10MB limit' })
    })

    render(
      <FileUploader
        orgId="test-org"
        userId="test-user"
        onUploadSuccess={mockOnUploadSuccess}
        onUploadError={mockOnUploadError}
      />
    )

    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv', { type: 'text/csv' })
    const fileInput = screen.getByRole('presentation').querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(fileInput, largeFile)

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith('File size exceeds 10MB limit')
    })
  })


  it('handles file upload through click', async () => {
    const user = userEvent.setup()
    
    // Mock successful upload response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        dataImportId: 'test-id', 
        data: [{ test: 'data' }], 
        headers: ['test', 'data']
      })
    })

    render(
      <FileUploader
        orgId="test-org"
        userId="test-user"
        onUploadSuccess={mockOnUploadSuccess}
        onUploadError={mockOnUploadError}
      />
    )

    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByRole('presentation').querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/data/upload', expect.any(Object))
    })
  })

  it('shows file information after upload', async () => {
    const user = userEvent.setup()
    
    // Mock successful upload response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        dataImportId: 'test-id', 
        data: [{ test: 'data' }], 
        headers: ['test']
      })
    })

    render(
      <FileUploader
        orgId="test-org"
        userId="test-user"
        onUploadSuccess={mockOnUploadSuccess}
        onUploadError={mockOnUploadError}
      />
    )

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByRole('presentation').querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(fileInput, file)

    // Wait for upload to complete and show file info
    await waitFor(() => {
      expect(screen.getByText(/successfully processed.*rows/i)).toBeInTheDocument()
      expect(screen.getByText(/detected.*columns/i)).toBeInTheDocument()
    })
  })

  it('displays file upload section when files are added', async () => {
    const user = userEvent.setup()
    
    // Mock successful upload response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        dataImportId: 'test-id', 
        data: [{ test: 'data' }], 
        headers: ['test']
      })
    })

    render(
      <FileUploader
        orgId="test-org"
        userId="test-user"
        onUploadSuccess={mockOnUploadSuccess}
        onUploadError={mockOnUploadError}
      />
    )

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByRole('presentation').querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('File Uploads')).toBeInTheDocument()
      expect(screen.getByText('test.csv')).toBeInTheDocument()
    })
  })
}) 