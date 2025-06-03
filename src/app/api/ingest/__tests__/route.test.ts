// Mock Prisma before importing anything else
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    prompt: {
      create: jest.fn(),
      update: jest.fn(),
    },
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    uRL: {
      upsert: jest.fn(),
    },
    postURL: {
      create: jest.fn(),
      deleteMany: jest.fn(),
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

describe('/api/ingest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST - Create Mode', () => {
    it('should create a new post with title and URLs', async () => {
      const mockUser = { id: 1, username: 'testuser' }
      const mockPrompt = { id: 1 }
      const mockPost = { id: 1 }
      const mockURL = { id: 1 }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.prompt.create.mockResolvedValue(mockPrompt)
      mockPrisma.post.create.mockResolvedValue(mockPost)
      mockPrisma.uRL.upsert.mockResolvedValue(mockURL)
      mockPrisma.postURL.create.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'My Dev Tools\nhttps://github.com\nhttps://stackoverflow.com',
          slug: 'testuser'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual({
        userId: 1,
        postId: 1,
        promptId: 1
      })

      // Verify database calls
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' }
      })
      expect(mockPrisma.prompt.create).toHaveBeenCalledWith({
        data: {
          rawText: 'My Dev Tools\nhttps://github.com\nhttps://stackoverflow.com',
          userId: 1
        }
      })
      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: {
          ownerId: 1,
          promptId: 1,
          title: 'My Dev Tools'
        }
      })
      expect(mockPrisma.uRL.upsert).toHaveBeenCalledTimes(2)
      expect(mockPrisma.postURL.create).toHaveBeenCalledTimes(2)
    })

    it('should create a new user if slug does not exist', async () => {
      const mockNewUser = { id: 2, username: 'newuser' }
      const mockPrompt = { id: 2 }
      const mockPost = { id: 2 }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(mockNewUser)
      mockPrisma.prompt.create.mockResolvedValue(mockPrompt)
      mockPrisma.post.create.mockResolvedValue(mockPost)

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'Just URLs\nhttps://example.com',
          slug: 'newuser'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'newuser',
          color1: expect.any(String),
          color2: expect.any(String),
          type: 'user'
        }
      })
    })

    it('should handle URLs-only posts (no title)', async () => {
      const mockUser = { id: 1, username: 'testuser' }
      const mockPrompt = { id: 1 }
      const mockPost = { id: 1 }
      const mockURL = { id: 1 }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.prompt.create.mockResolvedValue(mockPrompt)
      mockPrisma.post.create.mockResolvedValue(mockPost)
      mockPrisma.uRL.upsert.mockResolvedValue(mockURL)
      mockPrisma.postURL.create.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'https://github.com\nhttps://stackoverflow.com',
          slug: 'testuser'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: {
          ownerId: 1,
          promptId: 1,
          title: null
        }
      })
    })
  })

  describe('POST - Edit Mode', () => {
    it('should edit user profile', async () => {
      const mockUser = { id: 1, username: 'testuser' }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.user.update.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'Updated Profile Title\nhttps://mywebsite.com',
          slug: 'testuser',
          editing: { type: 'user' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: 'Updated Profile Title',
          description: 'https://mywebsite.com'
        }
      })
    })

    it('should edit existing post', async () => {
      const mockPost = {
        id: 1,
        ownerId: 1,
        promptId: 1,
        owner: { username: 'testuser' }
      }

      mockPrisma.post.findUnique.mockResolvedValue(mockPost)
      mockPrisma.prompt.update.mockResolvedValue({})
      mockPrisma.post.update.mockResolvedValue({})
      mockPrisma.postURL.deleteMany.mockResolvedValue({})
      mockPrisma.uRL.upsert.mockResolvedValue({ id: 1 })
      mockPrisma.postURL.create.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'Updated Post Title\nhttps://newurl.com',
          slug: 'testuser',
          editing: { type: 'post', id: 1 }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.prompt.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { rawText: 'Updated Post Title\nhttps://newurl.com' }
      })
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Updated Post Title' }
      })
      expect(mockPrisma.postURL.deleteMany).toHaveBeenCalledWith({
        where: { postId: 1 }
      })
    })
  })

  describe('Validation', () => {
    it('should reject missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({ slug: 'test' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Missing required fields')
    })

    it('should reject invalid slug format', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'test',
          slug: 'INVALID-SLUG!'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid slug format')
    })

    it('should reject reserved slugs', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'test',
          slug: 'api'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('reserved')
    })

    it('should reject unauthorized post editing', async () => {
      const mockPost = {
        id: 1,
        ownerId: 1,
        promptId: 1,
        owner: { username: 'otheruser' }
      }

      mockPrisma.post.findUnique.mockResolvedValue(mockPost)

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'Hacked content',
          slug: 'testuser',
          editing: { type: 'post', id: 1 }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'test',
          slug: 'testuser'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })
}) 