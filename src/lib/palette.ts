interface User {
  id: number
  username: string
  title: string | null
  color1: string
  color2: string
  type: string | null
}

// Helper function to determine if a color is light or dark
function isLightColor(hex: string): boolean {
  // Remove # if present
  const color = hex.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5
}

// Pick legible text color based on background
function pickLegible(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#111111' : '#ffffff'
}

// Get user by ID (mock function - in real app this would be a database call)
function getUser(id: number): User {
  // Mock users for fallback
  const users: Record<number, User> = {
    1: {
      id: 1,
      username: 'system',
      title: 'System',
      color1: '#eeeeee',
      color2: '#111111',
      type: 'system'
    },
    2: {
      id: 2,
      username: 'anonymous',
      title: 'Anonymous',
      color1: '#6366F1',
      color2: '#8B5CF6',
      type: 'system'
    }
  }
  
  return users[id] || users[2] // Fallback to anonymous
}

export function palette({
  cardOwner,        // canonical owner of merged post or page owner
  isFront,          // true on root "/"
  pageOwner,        // user whose profile we're on (undefined on front)
}: {
  cardOwner: User
  isFront: boolean
  pageOwner?: User
}) {
  const base = isFront ? getUser(1) : pageOwner ?? cardOwner
  const c1 = base.color1 ?? getUser(2).color1
  const c2 = base.color2 ?? getUser(2).color2
  
  return { 
    // Page colors: bg = color2, font = color1
    pageBg: c2,
    pageFont: c1,
    // Post card colors: bg = color1, font = color2
    cardBg: cardOwner.color1,
    cardFont: cardOwner.color2,
    // Filter pill colors: bg = color2, font = color1
    pillBg: c2,
    pillFont: c1
  }
} 