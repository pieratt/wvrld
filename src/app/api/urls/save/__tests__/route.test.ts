// Mock Prisma before importing anything else
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    uRL: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  }
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    __mockPrisma: mockPrisma
  }
})

import { POST } from '../route'
import { NextRequest } from 'next/server'

// Get the mock instance
const { __mockPrisma: mockPrisma } = require('@prisma/client')

describe('/api/urls/save', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should save a URL and increment save count', async () => {
    const mockURL = {
      id: 1,
      url: 'https://example.com',
      saves: 5
    }

    mockPrisma.uRL.findUnique.mockResolvedValue(mockURL)
    mockPrisma.uRL.update.mockResolvedValue({
      ...mockURL,
      saves: 6
    })

    const request = new NextRequest('http://localhost:3000/api/urls/save', {
      method: 'POST',
      body: JSON.stringify({
        urlId: 1,
        action: 'save'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.newSaveCount).toBe(6)

    expect(mockPrisma.uRL.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        saves: {
          increment: 1
        }
      }
    })
  })

  it('should unsave a URL and decrement save count', async () => {
    const mockURL = {
      id: 1,
      url: 'https://example.com',
      saves: 5
    }

    mockPrisma.uRL.findUnique.mockResolvedValue(mockURL)
    mockPrisma.uRL.update.mockResolvedValue({
      ...mockURL,
      saves: 4
    })

    const request = new NextRequest('http://localhost:3000/api/urls/save', {
      method: 'POST',
      body: JSON.stringify({
        urlId: 1,
        action: 'unsave'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.newSaveCount).toBe(4)

    expect(mockPrisma.uRL.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        saves: {
          increment: -1
        }
      }
    })
  })

  it('should prevent save count from going below 0', async () => {
    const mockURL = {
      id: 1,
      url: 'https://example.com',
      saves: 0
    }

    // First update call returns negative
    mockPrisma.uRL.findUnique.mockResolvedValue(mockURL)
    mockPrisma.uRL.update
      .mockResolvedValueOnce({
        ...mockURL,
        saves: -1
      })
      .mockResolvedValueOnce({
        ...mockURL,
        saves: 0
      })

    const request = new NextRequest('http://localhost:3000/api/urls/save', {
      method: 'POST',
      body: JSON.stringify({
        urlId: 1,
        action: 'unsave'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.newSaveCount).toBe(0)

    // Should be called twice - once to decrement, once to reset to 0
    expect(mockPrisma.uRL.update).toHaveBeenCalledTimes(2)
    expect(mockPrisma.uRL.update).toHaveBeenNthCalledWith(2, {
      where: { id: 1 },
      data: { saves: 0 }
    })
  })

  it('should return 404 for non-existent URL', async () => {
    mockPrisma.uRL.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/urls/save', {
      method: 'POST',
      body: JSON.stringify({
        urlId: 999,
        action: 'save'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('URL not found')
  })

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/urls/save', {
      method: 'POST',
      body: JSON.stringify({
        // Missing urlId and action
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing required fields: urlId and action')
  })

  it('should validate action field', async () => {
    const request = new NextRequest('http://localhost:3000/api/urls/save', {
      method: 'POST',
      body: JSON.stringify({
        urlId: 1,
        action: 'invalid'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Action must be either "save" or "unsave"')
  })

  it('should handle database errors', async () => {
    mockPrisma.uRL.findUnique.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/urls/save', {
      method: 'POST',
      body: JSON.stringify({
        urlId: 1,
        action: 'save'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })
}) 