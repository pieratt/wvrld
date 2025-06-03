export interface ParsedPrompt {
  title?: string
  urls: string[]
}

/**
 * Parses user input to extract title and URLs
 * 
 * Format:
 * - First non-URL line becomes the title (optional)
 * - All valid URLs are extracted in order
 * - Invalid lines are ignored
 * 
 * @param rawText - The raw user input
 * @returns Object with optional title and array of valid URLs
 */
export function parsePrompt(rawText: string): ParsedPrompt {
  if (!rawText || typeof rawText !== 'string') {
    return { urls: [] }
  }

  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  if (lines.length === 0) {
    return { urls: [] }
  }

  let title: string | undefined
  const urls: string[] = []

  for (const line of lines) {
    if (isValidURL(line)) {
      urls.push(canonicalizeURL(line))
    } else if (!title) {
      // First non-URL line becomes the title
      title = line
    }
    // Subsequent non-URL lines are ignored
  }

  const result: ParsedPrompt = { urls }
  if (title) {
    result.title = title
  }

  return result
}

/**
 * Validates if a string is a valid URL
 */
function isValidURL(str: string): boolean {
  try {
    const url = new URL(str)
    // Only allow common web protocols
    const validProtocols = ['http:', 'https:', 'ftp:', 'ftps:']
    return validProtocols.includes(url.protocol)
  } catch {
    return false
  }
}

/**
 * Canonicalizes a URL by:
 * - Converting to lowercase hostname
 * - Removing common tracking parameters
 * - Ensuring https protocol for common domains
 * - Removing trailing slashes from pathname (except for root)
 */
function canonicalizeURL(url: string): string {
  try {
    const parsed = new URL(url)
    
    // Convert hostname to lowercase
    parsed.hostname = parsed.hostname.toLowerCase()
    
    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'source'
    ]
    
    trackingParams.forEach(param => {
      parsed.searchParams.delete(param)
    })
    
    // Ensure https for common domains
    if (parsed.protocol === 'http:' && isCommonSecureDomain(parsed.hostname)) {
      parsed.protocol = 'https:'
    }
    
    let result = parsed.toString()
    
    // Remove trailing slash if it's just the root path (URL constructor adds it automatically)
    if (result.endsWith('/') && parsed.pathname === '/' && !parsed.search && !parsed.hash) {
      result = result.slice(0, -1)
    }
    
    return result
  } catch {
    // If canonicalization fails, return original
    return url
  }
}

/**
 * Check if domain commonly supports HTTPS
 */
function isCommonSecureDomain(hostname: string): boolean {
  const secureDomains = [
    'github.com', 'youtube.com', 'twitter.com', 'facebook.com',
    'instagram.com', 'linkedin.com', 'reddit.com', 'stackoverflow.com',
    'medium.com', 'dev.to', 'vercel.com', 'netlify.com'
  ]
  
  return secureDomains.some(domain => 
    hostname === domain || hostname.endsWith(`.${domain}`)
  )
} 