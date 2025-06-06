import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import AddURLModal from '../AddURLModal'

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('AddURLModal', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
  })

  it('should render when isOpen is true', () => {
    render(
      <AddURLModal
        isOpen={true}
        onClose={mockOnClose}
        bucketSlug="test-bucket"
      />
    )

    expect(screen.getByText('Add URLs to test-bucket')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/My awesome collection/)).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    render(
      <AddURLModal
        isOpen={false}
        onClose={mockOnClose}
        bucketSlug="test-bucket"
      />
    )

    expect(screen.queryByText('Add URLs to test-bucket')).not.toBeInTheDocument()
  })

  it('should close modal when cancel button is clicked', () => {
    render(
      <AddURLModal
        isOpen={true}
        onClose={mockOnClose}
        bucketSlug="test-bucket"
      />
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show error when trying to submit empty form', async () => {
    render(
      <AddURLModal
        isOpen={true}
        onClose={mockOnClose}
        bucketSlug="test-bucket"
      />
    )

    fireEvent.click(screen.getByText('Add URLs'))

    await waitFor(() => {
      expect(screen.getByText('Please enter some content')).toBeInTheDocument()
    })
  })

  it('should submit form and redirect to new post on success', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        data: { postId: 123, userId: 1 }
      })
    })

    render(
      <AddURLModal
        isOpen={true}
        onClose={mockOnClose}
        bucketSlug="test-bucket"
      />
    )

    const textarea = screen.getByPlaceholderText(/My awesome collection/)
    fireEvent.change(textarea, { 
      target: { value: 'Test Post\nhttps://example.com' } 
    })

    fireEvent.click(screen.getByText('Add URLs'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: 'Test Post\nhttps://example.com',
          slug: 'test-bucket'
        })
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/test-bucket/123')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should refresh page for anonymous bucket', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        data: { postId: 123, userId: 2 }
      })
    })

    render(
      <AddURLModal
        isOpen={true}
        onClose={mockOnClose}
        bucketSlug="anonymous"
      />
    )

    const textarea = screen.getByPlaceholderText(/My awesome collection/)
    fireEvent.change(textarea, { 
      target: { value: 'https://example.com' } 
    })

    fireEvent.click(screen.getByText('Add URLs'))

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should show error message on API error', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Invalid slug format'
      })
    })

    render(
      <AddURLModal
        isOpen={true}
        onClose={mockOnClose}
        bucketSlug="test-bucket"
      />
    )

    const textarea = screen.getByPlaceholderText(/My awesome collection/)
    fireEvent.change(textarea, { 
      target: { value: 'https://example.com' } 
    })

    fireEvent.click(screen.getByText('Add URLs'))

    await waitFor(() => {
      expect(screen.getByText('Invalid slug format')).toBeInTheDocument()
    })
  })
}) 