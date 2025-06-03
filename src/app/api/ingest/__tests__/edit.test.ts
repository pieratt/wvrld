// Mock the PrismaClient constructor first
jest.mock('@prisma/client', () => {
  const mockPrismaInstance = {
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
    PrismaClient: jest.fn(() => mockPrismaInstance),
    __mockPrismaInstance: mockPrismaInstance
  }
})

import { POST } from '../route'
import { NextRequest } from 'next/server'

// Get the mock instance
const { __mockPrismaInstance: mockPrismaInstance } = jest.requireMock('@prisma/client')

describe('Ingest API - Edit Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User/Bucket Editing', () => {
    it('should update user profile with title and description', async () => {
      // Mock existing user
      mockPrismaInstance.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'alice',
        title: 'Old Title',
        description: 'Old Description',
        color1: '#ff0000',
        color2: '#00ff00',
      })

      mockPrismaInstance.user.update.mockResolvedValue({
        id: 1,
        username: 'alice',
        title: 'New Title',
        description: 'New Description',
      })

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'New Title\nNew Description',
          slug: 'alice',
          editing: {
            type: 'user'
          }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.userId).toBe(1)

      expect(mockPrismaInstance.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: 'New Title',
          description: 'New Description'
        }
      })
    })

    it('should handle user not found for profile editing', async () => {
      mockPrismaInstance.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'New Title',
          slug: 'nonexistent',
          editing: {
            type: 'user'
          }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('User not found')
    })
  })

  describe('Post Editing', () => {
    it('should update post title and URLs', async () => {
      // Mock existing post
      mockPrismaInstance.post.findUnique.mockResolvedValue({
        id: 1,
        title: 'Old Title',
        ownerId: 1,
        promptId: 1,
        owner: {
          username: 'alice'
        }
      })

      mockPrismaInstance.prompt.update.mockResolvedValue({
        id: 1,
        rawText: 'New Title\nhttps://example.com'
      })

      mockPrismaInstance.post.update.mockResolvedValue({
        id: 1,
        title: 'New Title'
      })

      mockPrismaInstance.postURL.deleteMany.mockResolvedValue({ count: 2 })

      mockPrismaInstance.uRL.upsert.mockResolvedValue({
        id: 1,
        url: 'https://example.com',
        domain: 'example.com'
      })

      mockPrismaInstance.postURL.create.mockResolvedValue({
        id: 1,
        postId: 1,
        urlId: 1,
        order: 0
      })

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'New Title\nhttps://example.com',
          slug: 'alice',
          editing: {
            type: 'post',
            id: 1
          }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.postId).toBe(1)

      // Verify prompt was updated
      expect(mockPrismaInstance.prompt.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { rawText: 'New Title\nhttps://example.com' }
      })

      // Verify post title was updated
      expect(mockPrismaInstance.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'New Title' }
      })

      // Verify old URLs were removed
      expect(mockPrismaInstance.postURL.deleteMany).toHaveBeenCalledWith({
        where: { postId: 1 }
      })

      // Verify new URL was added
      expect(mockPrismaInstance.uRL.upsert).toHaveBeenCalled()
      expect(mockPrismaInstance.postURL.create).toHaveBeenCalled()
    })

    it('should require post ID for post editing', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'New Title',
          slug: 'alice',
          editing: {
            type: 'post'
            // Missing id
          }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post ID required for post editing')
    })

    it('should handle post not found', async () => {
      mockPrismaInstance.post.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'New Title',
          slug: 'alice',
          editing: {
            type: 'post',
            id: 999
          }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Post not found')
    })

    it('should prevent editing posts from different buckets', async () => {
      mockPrismaInstance.post.findUnique.mockResolvedValue({
        id: 1,
        title: 'Some Title',
        ownerId: 2,
        promptId: 1,
        owner: {
          username: 'bob' // Different from slug 'alice'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'New Title',
          slug: 'alice',
          editing: {
            type: 'post',
            id: 1
          }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized: Post does not belong to this bucket')
    })

    it('should handle post without prompt', async () => {
      // Mock post without promptId
      mockPrismaInstance.post.findUnique.mockResolvedValue({
        id: 1,
        title: 'Old Title',
        ownerId: 1,
        promptId: null,
        owner: {
          username: 'alice'
        }
      })

      mockPrismaInstance.post.update.mockResolvedValue({
        id: 1,
        title: 'New Title'
      })

      mockPrismaInstance.postURL.deleteMany.mockResolvedValue({ count: 0 })

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'New Title',
          slug: 'alice',
          editing: {
            type: 'post',
            id: 1
          }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Should not try to update prompt if it doesn't exist
      expect(mockPrismaInstance.prompt.update).not.toHaveBeenCalled()

      // Should still update post title
      expect(mockPrismaInstance.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'New Title' }
      })
    })
  })

  describe('Edit Mode Validation', () => {
    it('should reject invalid edit type', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: JSON.stringify({
          rawText: 'Some content',
          slug: 'alice',
          editing: {
            type: 'invalid' as any
          }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid edit type')
    })
  })
}) 