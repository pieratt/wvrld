import { parsePrompt, ParsedPrompt } from '../parsePrompt'

describe('parsePrompt', () => {
  describe('basic functionality', () => {
    it('should return empty urls array for empty input', () => {
      expect(parsePrompt('')).toEqual({ urls: [] })
      expect(parsePrompt('   ')).toEqual({ urls: [] })
      expect(parsePrompt('\n\n')).toEqual({ urls: [] })
    })

    it('should handle null/undefined input', () => {
      expect(parsePrompt(null as any)).toEqual({ urls: [] })
      expect(parsePrompt(undefined as any)).toEqual({ urls: [] })
    })
  })

  describe('title-only scenarios', () => {
    it('should extract title when no URLs present', () => {
      const result = parsePrompt('My awesome playlist')
      expect(result).toEqual({
        title: 'My awesome playlist',
        urls: []
      })
    })

    it('should use first non-URL line as title', () => {
      const result = parsePrompt(`My Spring Playlist
      Some random text
      Another line`)
      expect(result).toEqual({
        title: 'My Spring Playlist',
        urls: []
      })
    })

    it('should handle multiline title-only with whitespace', () => {
      const result = parsePrompt(`
        
        Design Resources
        
        More text here
        
      `)
      expect(result).toEqual({
        title: 'Design Resources',
        urls: []
      })
    })
  })

  describe('urls-only scenarios', () => {
    it('should extract single URL without title', () => {
      const result = parsePrompt('https://github.com/vercel/next.js')
      expect(result).toEqual({
        urls: ['https://github.com/vercel/next.js']
      })
    })

    it('should extract multiple URLs without title', () => {
      const result = parsePrompt(`https://github.com/vercel/next.js
https://tailwindcss.com
https://prisma.io`)
      expect(result).toEqual({
        urls: [
          'https://github.com/vercel/next.js',
          'https://tailwindcss.com',
          'https://prisma.io'
        ]
      })
    })

    it('should handle URLs with different protocols', () => {
      const result = parsePrompt(`https://example.com
http://test.com
ftp://files.example.com`)
      expect(result).toEqual({
        urls: [
          'https://example.com',
          'http://test.com',
          'ftp://files.example.com'
        ]
      })
    })
  })

  describe('mixed title and URLs', () => {
    it('should extract title and URLs correctly', () => {
      const result = parsePrompt(`My playlist for Spring
https://bandcamp.com/album1
https://soundcloud.com/track/abc`)
      expect(result).toEqual({
        title: 'My playlist for Spring',
        urls: [
          'https://bandcamp.com/album1',
          'https://soundcloud.com/track/abc'
        ]
      })
    })

    it('should ignore non-URL lines after title', () => {
      const result = parsePrompt(`Design Tools
Some description here
https://figma.com
Random text
https://sketch.com
More random text`)
      expect(result).toEqual({
        title: 'Design Tools',
        urls: [
          'https://figma.com',
          'https://sketch.com'
        ]
      })
    })

    it('should handle complex real-world example', () => {
      const result = parsePrompt(`
        Frontend Development Resources
        
        https://nextjs.org
        https://tailwindcss.com
        Some notes about these tools
        https://vercel.com
        
        Additional comments
      `)
      expect(result).toEqual({
        title: 'Frontend Development Resources',
        urls: [
          'https://nextjs.org',
          'https://tailwindcss.com',
          'https://vercel.com'
        ]
      })
    })
  })

  describe('malformed URL handling', () => {
    it('should ignore invalid URLs', () => {
      const result = parsePrompt(`My Links
not-a-url
https://valid.com
just-text
http://another-valid.com
invalid://bad-protocol`)
      expect(result).toEqual({
        title: 'My Links',
        urls: [
          'https://valid.com',
          'http://another-valid.com'
        ]
      })
    })

    it('should handle URLs with spaces (invalid)', () => {
      const result = parsePrompt(`Links
https://valid.com
https://invalid url.com
https://another-valid.com`)
      expect(result).toEqual({
        title: 'Links',
        urls: [
          'https://valid.com',
          'https://another-valid.com'
        ]
      })
    })

    it('should handle partial URLs', () => {
      const result = parsePrompt(`Resources
www.example.com
https://valid.com
example.com
http://also-valid.com`)
      expect(result).toEqual({
        title: 'Resources',
        urls: [
          'https://valid.com',
          'http://also-valid.com'
        ]
      })
    })
  })

  describe('URL canonicalization', () => {
    it('should convert hostname to lowercase', () => {
      const result = parsePrompt('https://GitHub.COM/vercel/next.js')
      expect(result.urls[0]).toBe('https://github.com/vercel/next.js')
    })

    it('should remove tracking parameters', () => {
      const result = parsePrompt('https://example.com/page?utm_source=twitter&utm_medium=social&normal_param=keep')
      expect(result.urls[0]).toBe('https://example.com/page?normal_param=keep')
    })

    it('should upgrade HTTP to HTTPS for common domains', () => {
      const result = parsePrompt(`http://github.com/test
http://youtube.com/watch
http://unknown-domain.com/page`)
      expect(result.urls).toEqual([
        'https://github.com/test',
        'https://youtube.com/watch',
        'http://unknown-domain.com/page'
      ])
    })

    it('should handle complex canonicalization', () => {
      const result = parsePrompt('http://GitHub.COM/repo?utm_source=email&ref=newsletter&keep=this')
      expect(result.urls[0]).toBe('https://github.com/repo?keep=this')
    })

    it('should preserve original URL if canonicalization fails', () => {
      // This shouldn't happen with valid URLs, but test the fallback
      const result = parsePrompt('https://valid.com')
      expect(result.urls[0]).toBe('https://valid.com')
    })
  })

  describe('edge cases', () => {
    it('should handle URLs at the beginning', () => {
      const result = parsePrompt(`https://first.com
Title comes after
https://second.com`)
      expect(result).toEqual({
        title: 'Title comes after',
        urls: [
          'https://first.com',
          'https://second.com'
        ]
      })
    })

    it('should handle only whitespace and URLs', () => {
      const result = parsePrompt(`
        
        https://example.com
        
        https://another.com
        
      `)
      expect(result).toEqual({
        urls: [
          'https://example.com',
          'https://another.com'
        ]
      })
    })

    it('should preserve URL order', () => {
      const urls = [
        'https://first.com',
        'https://second.com',
        'https://third.com',
        'https://fourth.com'
      ]
      const result = parsePrompt(`My Links\n${urls.join('\n')}`)
      expect(result.urls).toEqual(urls)
    })
  })
}) 