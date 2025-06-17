/**
 * Remove www. prefix from domain names for cleaner display
 */
export function cleanDomain(domain: string | null): string | null {
  if (!domain) return null
  return domain.replace(/^www\./, '')
}

/**
 * Get a clean, readable title for a URL
 * Prioritizes actual title, falls back to cleaned domain, then full URL
 */
export function getDisplayTitle(title: string | null, url: string, domain: string | null): string {
  if (title) return title
  if (domain) return cleanDomain(domain) || domain
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
} 