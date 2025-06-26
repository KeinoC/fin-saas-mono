import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FileUploader } from '@features/data/components/file-uploader'

const mockOnFileSelect = jest.fn()
const mockOnUpload = jest.fn()

describe('FileUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders upload area correctly', () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onUpload={mockOnUpload}
        maxFileSize={10 * 1024 * 1024}
        acceptedFileTypes={['.csv', '.xlsx']}
      />
    )

    expect(screen.getByText('Drop files here or click to upload')).toBeInTheDocument()
    expect(screen.getByText('CSV, Excel files up to 10MB')).toBeInTheDocument()
  })

  it('handles file selection via input', () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onUpload={mockOnUpload}
        maxFileSize={10 * 1024 * 1024}
        acceptedFileTypes={['.csv', '.xlsx']}
      />
    )

    const file = new File(['test,data\n1,2'], 'test.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('File upload')

    fireEvent.change(input, { target: { files: [file] } })

    expect(mockOnFileSelect).toHaveBeenCalledWith(file)
  })

  it('validates file size', () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onUpload={mockOnUpload}
        maxFileSize={1024}
        acceptedFileTypes={['.csv']}
      />
    )

    const largeFile = new File(['x'.repeat(2048)], 'large.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('File upload')

    fireEvent.change(input, { target: { files: [largeFile] } })

    expect(screen.getByText('File size exceeds maximum limit of 1KB')).toBeInTheDocument()
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('validates file type', () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onUpload={mockOnUpload}
        maxFileSize={10 * 1024 * 1024}
        acceptedFileTypes={['.csv']}
      />
    )

    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText('File upload')

    fireEvent.change(input, { target: { files: [invalidFile] } })

    expect(screen.getByText('Invalid file type. Please upload: .csv')).toBeInTheDocument()
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('handles drag and drop', () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onUpload={mockOnUpload}
        maxFileSize={10 * 1024 * 1024}
        acceptedFileTypes={['.csv']}
      />
    )

    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' })
    const dropZone = screen.getByTestId('file-drop-zone')

    fireEvent.dragOver(dropZone)
    expect(dropZone).toHaveClass('border-blue-400')

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] }
    })

    expect(mockOnFileSelect).toHaveBeenCalledWith(file)
  })

  it('shows upload progress', async () => {
    const mockUploadPromise = new Promise(resolve => {
      setTimeout(() => resolve({ success: true }), 100)
    })
    mockOnUpload.mockReturnValue(mockUploadPromise)

    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onUpload={mockOnUpload}
        maxFileSize={10 * 1024 * 1024}
        acceptedFileTypes={['.csv']}
        selectedFile={new File(['test'], 'test.csv', { type: 'text/csv' })}
      />
    )

    fireEvent.click(screen.getByText('Upload File'))

    expect(screen.getByText('Uploading...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Upload Complete')).toBeInTheDocument()
    })
  })

  it('handles upload errors', async () => {
    mockOnUpload.mockRejectedValue(new Error('Upload failed'))

    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onUpload={mockOnUpload}
        maxFileSize={10 * 1024 * 1024}
        acceptedFileTypes={['.csv']}
        selectedFile={new File(['test'], 'test.csv', { type: 'text/csv' })}
      />
    )

    fireEvent.click(screen.getByText('Upload File'))

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })
}) 