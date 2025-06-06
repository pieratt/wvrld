import { NextRequest } from 'next/server'
import { POST, GET } from '../route'

// Mock Prisma
const mockPrismaInstance = {
  uRL: {
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  }
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaInstance)
}))

// Mock open-graph-scraper
const mockOgs = jest.fn()
jest.mock('open-graph-scraper', () => mockOgs)

// Mock console methods to avoid noise in tests
jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'error').mockImplementation(() => {})

describe('Metadata API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/metadata', () => {
    it('should process pending URLs successfully', async () => {
      // Mock pending URLs from database
      const mockPendingUrls = [
        {
          id: 1,
          url: 'https://example.com',
          createdAt: new Date()
        },
        {
          id: 2,
          url: 'https://github.com/vercel/next.js',
          createdAt: new Date()
        }
      ]

      mockPrismaInstance.uRL.findMany.mockResolvedValue(mockPendingUrls)
      mockPrismaInstance.uRL.update.mockResolvedValue({})

      // Mock successful OpenGraph responses
      mockOgs
        .mockResolvedValueOnce({
          result: {
            ogTitle: 'Example Title',
            ogDescription: 'Example description',
            ogImage: [{ url: 'https://example.com/image.jpg' }]
          }
        })
        .mockResolvedValueOnce({
          result: {
            ogTitle: 'Next.js - The React Framework',
            ogDescription: 'The React Framework for the Web',
            ogImage: { url: '/logo.png' } // Relative URL to test absolute conversion
          }
        })

      const request = new NextRequest('http://localhost:3000/api/metadata', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.processed).toBe(2)
      expect(data.successful).toBe(2)
      expect(data.failed).toBe(0)

      // Verify database calls
      expect(mockPrismaInstance.uRL.findMany).toHaveBeenCalledWith({
        where: { metadataStatus: 'PENDING' },
        take: 10,
        orderBy: { createdAt: 'asc' }
      })

      // Verify URLs were updated with SUCCESS status
      expect(mockPrismaInstance.uRL.update).toHaveBeenCalledTimes(2)
      expect(mockPrismaInstance.uRL.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: 'Example Title',
          description: 'Example description',
          image1: 'https://example.com/image.jpg',
          metadataStatus: 'SUCCESS',
          updatedAt: expect.any(Date)
        }
      })

      expect(mockPrismaInstance.uRL.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: {
          title: 'Next.js - The React Framework',
          description: 'The React Framework for the Web',
          image1: 'https://github.com/logo.png', // Should be converted to absolute URL
          metadataStatus: 'SUCCESS',
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should handle OpenGraph failures gracefully', async () => {
      const mockPendingUrls = [
        {
          id: 1,
          url: 'https://broken-site.com',
          createdAt: new Date()
        }
      ]

      mockPrismaInstance.uRL.findMany.mockResolvedValue(mockPendingUrls)
      mockPrismaInstance.uRL.update.mockResolvedValue({})

      // Mock OpenGraph failure
      mockOgs.mockRejectedValue(new Error('Network timeout'))

      const request = new NextRequest('http://localhost:3000/api/metadata', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.processed).toBe(1)
      expect(data.successful).toBe(0)
      expect(data.failed).toBe(1)

      // Verify URL was marked as FAILED
      expect(mockPrismaInstance.uRL.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          metadataStatus: 'FAILED',
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should return early when no pending URLs exist', async () => {
      mockPrismaInstance.uRL.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/metadata', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('No pending URLs to process')
      expect(data.processed).toBe(0)

      // Should not call update since no URLs to process
      expect(mockPrismaInstance.uRL.update).not.toHaveBeenCalled()
      expect(mockOgs).not.toHaveBeenCalled()
    })

    it('should handle missing OpenGraph data gracefully', async () => {
      const mockPendingUrls = [
        {
          id: 1,
          url: 'https://minimal-site.com',
          createdAt: new Date()
        }
      ]

      mockPrismaInstance.uRL.findMany.mockResolvedValue(mockPendingUrls)
      mockPrismaInstance.uRL.update.mockResolvedValue({})

      // Mock OpenGraph response with minimal data
      mockOgs.mockResolvedValue({
        result: {
          // No og tags, just basic response
        }
      })

      const request = new NextRequest('http://localhost:3000/api/metadata', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.successful).toBe(1)

      // Verify URL was updated with null values for missing data
      expect(mockPrismaInstance.uRL.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: null,
          description: null,
          image1: null,
          metadataStatus: 'SUCCESS',
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should handle database errors', async () => {
      mockPrismaInstance.uRL.findMany.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/metadata', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
      expect(data.details).toBe('Database connection failed')
    })

    it('should fallback to Twitter metadata when OpenGraph is unavailable', async () => {
      const mockPendingUrls = [
        {
          id: 1,
          url: 'https://twitter-site.com',
          createdAt: new Date()
        }
      ]

      mockPrismaInstance.uRL.findMany.mockResolvedValue(mockPendingUrls)
      mockPrismaInstance.uRL.update.mockResolvedValue({})

      // Mock OpenGraph response with Twitter metadata only
      mockOgs.mockResolvedValue({
        result: {
          twitterTitle: 'Twitter Title',
          twitterDescription: 'Twitter description',
          twitterImage: [{ url: 'https://twitter-site.com/twitter-image.jpg' }]
        }
      })

      const request = new NextRequest('http://localhost:3000/api/metadata', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.successful).toBe(1)

      // Verify Twitter metadata was used
      expect(mockPrismaInstance.uRL.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: 'Twitter Title',
          description: 'Twitter description',
          image1: 'https://twitter-site.com/twitter-image.jpg',
          metadataStatus: 'SUCCESS',
          updatedAt: expect.any(Date)
        }
      })
    })
  })

  describe('GET /api/metadata', () => {
    it('should return metadata statistics', async () => {
      // Mock database counts
      mockPrismaInstance.uRL.count
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(15) // successful
        .mockResolvedValueOnce(2) // failed

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.stats).toEqual({
        pending: 5,
        successful: 15,
        failed: 2,
        total: 22
      })

      // Verify database calls
      expect(mockPrismaInstance.uRL.count).toHaveBeenCalledTimes(3)
      expect(mockPrismaInstance.uRL.count).toHaveBeenCalledWith({
        where: { metadataStatus: 'PENDING' }
      })
      expect(mockPrismaInstance.uRL.count).toHaveBeenCalledWith({
        where: { metadataStatus: 'SUCCESS' }
      })
      expect(mockPrismaInstance.uRL.count).toHaveBeenCalledWith({
        where: { metadataStatus: 'FAILED' }
      })
    })

    it('should handle database errors in stats endpoint', async () => {
      mockPrismaInstance.uRL.count.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })
}) 