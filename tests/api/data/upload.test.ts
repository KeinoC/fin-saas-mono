import { POST } from '@/app/api/data/upload/route'
import { NextRequest } from 'next/server'
import { DatabaseService } from 'database/lib/service'

jest.mock('database/lib/service')
jest.mock('@lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>
const { auth } = require('@lib/auth')

describe('/api/data/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.api.getSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { id: 'session-1' }
    })
  })

  it('handles CSV file upload successfully', async () => {
    const csvContent = 'date,description,amount\n2024-01-01,Test Transaction,100.00'
    const formData = new FormData()
    formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')
    formData.append('orgId', 'org-1')

    const request = new NextRequest('http://localhost:3000/api/data/upload', {
      method: 'POST',
      body: formData,
    })

    mockDatabaseService.createDataImport.mockResolvedValue({
      id: 'import-1',
      orgId: 'org-1',
      userId: 'user-1',
      filename: 'test.csv',
      status: 'completed',
      totalRows: 1,
      successfulRows: 1,
      errors: [],
      createdAt: new Date(),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.importId).toBe('import-1')
    expect(mockDatabaseService.createDataImport).toHaveBeenCalledWith({
      orgId: 'org-1',
      userId: 'user-1',
      filename: 'test.csv',
      fileType: 'csv',
      originalData: csvContent,
      parsedData: expect.any(Array),
    })
  })

  it('validates file type', async () => {
    const formData = new FormData()
    formData.append('file', new Blob(['invalid content'], { type: 'text/plain' }), 'test.txt')
    formData.append('orgId', 'org-1')

    const request = new NextRequest('http://localhost:3000/api/data/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Invalid file type. Only CSV and Excel files are supported.')
  })

  it('validates file size', async () => {
    const largeContent = 'x'.repeat(11 * 1024 * 1024) // 11MB
    const formData = new FormData()
    formData.append('file', new Blob([largeContent], { type: 'text/csv' }), 'large.csv')
    formData.append('orgId', 'org-1')

    const request = new NextRequest('http://localhost:3000/api/data/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('File size exceeds maximum limit of 10MB.')
  })

  it('validates CSV structure', async () => {
    const invalidCsv = 'invalid,csv,structure\nno,proper,headers'
    const formData = new FormData()
    formData.append('file', new Blob([invalidCsv], { type: 'text/csv' }), 'invalid.csv')
    formData.append('orgId', 'org-1')

    const request = new NextRequest('http://localhost:3000/api/data/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toContain('Required columns missing')
  })

  it('handles authentication failure', async () => {
    auth.api.getSession.mockResolvedValue(null)

    const formData = new FormData()
    formData.append('file', new Blob(['test'], { type: 'text/csv' }), 'test.csv')
    formData.append('orgId', 'org-1')

    const request = new NextRequest('http://localhost:3000/api/data/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(401)
    expect(result.error).toBe('Unauthorized')
  })

  it('handles database errors gracefully', async () => {
    const csvContent = 'date,description,amount\n2024-01-01,Test Transaction,100.00'
    const formData = new FormData()
    formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv')
    formData.append('orgId', 'org-1')

    const request = new NextRequest('http://localhost:3000/api/data/upload', {
      method: 'POST',
      body: formData,
    })

    mockDatabaseService.createDataImport.mockRejectedValue(new Error('Database connection failed'))

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.error).toBe('Internal server error')
  })

  it('handles Excel file upload', async () => {
    // Mock Excel file (simplified)
    const excelBuffer = Buffer.from('fake excel content')
    const formData = new FormData()
    formData.append('file', new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    }), 'test.xlsx')
    formData.append('orgId', 'org-1')

    const request = new NextRequest('http://localhost:3000/api/data/upload', {
      method: 'POST',
      body: formData,
    })

    mockDatabaseService.createDataImport.mockResolvedValue({
      id: 'import-2',
      orgId: 'org-1',
      userId: 'user-1',
      filename: 'test.xlsx',
      status: 'completed',
      totalRows: 1,
      successfulRows: 1,
      errors: [],
      createdAt: new Date(),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(mockDatabaseService.createDataImport).toHaveBeenCalledWith({
      orgId: 'org-1',
      userId: 'user-1',
      filename: 'test.xlsx',
      fileType: 'xlsx',
      originalData: expect.any(String),
      parsedData: expect.any(Array),
    })
  })
}) 