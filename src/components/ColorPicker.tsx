'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface ColorPickerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (color1: string, color2: string) => void
  initialColor1: string
  initialColor2: string
  currentUser: {
    id: number
    username: string
    title: string | null
    color1: string
    color2: string
  }
}

interface Position {
  x: number
  y: number
}

export default function ColorPicker({ 
  isOpen, 
  onClose, 
  onSave, 
  initialColor1, 
  initialColor2, 
  currentUser 
}: ColorPickerProps) {
  const [color1, setColor1] = useState(initialColor1)
  const [color2, setColor2] = useState(initialColor2)
  const [color1Hex, setColor1Hex] = useState(initialColor1)
  const [color2Hex, setColor2Hex] = useState(initialColor2)
  const [position1, setPosition1] = useState<Position>({ x: 0, y: 0 })
  const [position2, setPosition2] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<1 | 2 | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Convert hex to position on canvas
  function hexToPosition(hex: string, width: number, height: number): Position {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    // Convert RGB to HSV for positioning
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min

    let h = 0
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6
      else if (max === g) h = (b - r) / diff + 2
      else h = (r - g) / diff + 4
    }
    h = h * 60
    if (h < 0) h += 360

    const s = max === 0 ? 0 : diff / max
    const v = max

    // Map to canvas coordinates
    const grayZoneStart = 0.85 // Last 15% of width is gray zone
    
    // Y axis: brightness inverted so top is bright, bottom is dark
    const y = (1 - v) * (height - 1)
    
    // X axis: depends on whether it's a color or gray
    let x
    if (s > 0.1) {
      // Color zone: map hue to left 85% of width
      x = (h / 360) * grayZoneStart * (width - 1)
    } else {
      // Gray zone: place in right 15% of width, position based on brightness
      x = (grayZoneStart + (1 - grayZoneStart) * 0.5) * (width - 1) // Middle of gray zone
    }

    return { x, y }
  }

  // Convert canvas position to hex color
  function positionToHex(pos: Position, width: number, height: number): string {
    const x = Math.max(0, Math.min(pos.x, width - 1))
    const y = Math.max(0, Math.min(pos.y, height - 1))

    // Map canvas coordinates to color values
    const xNorm = x / (width - 1)
    const yNorm = y / (height - 1)
    
    // Y-axis: Brightness from bright (top) to black (bottom)
    const value = 1 - yNorm
    
    // X-axis: Hue for most of the width, gray zone on the right
    const grayZoneStart = 0.85 // Last 15% of width is gray zone
    let hue = 0
    let saturation = 1.0
    
    if (xNorm < grayZoneStart) {
      // Color zone: full hue spectrum
      hue = (xNorm / grayZoneStart) * 360
      saturation = 1.0
    } else {
      // Gray zone: desaturated
      hue = 0 // Hue doesn't matter for grays
      saturation = 0.0
    }

    // Convert HSV to RGB
    const c = value * saturation
    const hSector = hue / 60
    const xVal = c * (1 - Math.abs((hSector % 2) - 1))
    const m = value - c

    let r = 0, g = 0, b = 0

    if (hSector >= 0 && hSector < 1) {
      r = c; g = xVal; b = 0
    } else if (hSector >= 1 && hSector < 2) {
      r = xVal; g = c; b = 0
    } else if (hSector >= 2 && hSector < 3) {
      r = 0; g = c; b = xVal
    } else if (hSector >= 3 && hSector < 4) {
      r = 0; g = xVal; b = c
    } else if (hSector >= 4 && hSector < 5) {
      r = xVal; g = 0; b = c
    } else if (hSector >= 5 && hSector < 6) {
      r = c; g = 0; b = xVal
    }

    const red = Math.round((r + m) * 255)
    const green = Math.round((g + m) * 255)
    const blue = Math.round((b + m) * 255)

    return '#' + [red, green, blue].map(val => {
      const hex = val.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  // Draw the full color spectrum
  const drawColorSpectrum = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas

    // Create image data for better performance
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const xNorm = x / (width - 1)
        const yNorm = y / (height - 1)
        
        // Y-axis: Brightness from bright (top) to black (bottom)
        const value = 1 - yNorm
        
        // X-axis: Hue for most of the width, gray zone on the right
        const grayZoneStart = 0.85 // Last 15% of width is gray zone
        let hue = 0
        let saturation = 1.0
        
        if (xNorm < grayZoneStart) {
          // Color zone: full hue spectrum
          hue = (xNorm / grayZoneStart) * 360
          saturation = 1.0
        } else {
          // Gray zone: desaturated
          hue = 0 // Hue doesn't matter for grays
          saturation = 0.0
        }

        // Convert HSV to RGB
        const c = value * saturation
        const hSector = hue / 60
        const xVal = c * (1 - Math.abs((hSector % 2) - 1))
        const m = value - c

        let r = 0, g = 0, b = 0

        if (hSector >= 0 && hSector < 1) {
          r = c; g = xVal; b = 0
        } else if (hSector >= 1 && hSector < 2) {
          r = xVal; g = c; b = 0
        } else if (hSector >= 2 && hSector < 3) {
          r = 0; g = c; b = xVal
        } else if (hSector >= 3 && hSector < 4) {
          r = 0; g = xVal; b = c
        } else if (hSector >= 4 && hSector < 5) {
          r = xVal; g = 0; b = c
        } else if (hSector >= 5 && hSector < 6) {
          r = c; g = 0; b = xVal
        }

        const index = (y * width + x) * 4
        data[index] = Math.round((r + m) * 255)     // R
        data[index + 1] = Math.round((g + m) * 255) // G
        data[index + 2] = Math.round((b + m) * 255) // B
        data[index + 3] = 255                       // A
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [])

  // Throttled update function for better performance
  const throttledUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      // Update CSS variables for live preview
      document.documentElement.style.setProperty('--c1', color1)
      document.documentElement.style.setProperty('--c2', color2)
    }, isDragging ? 16 : 0) // 60fps when dragging, immediate when not
  }, [color1, color2, isDragging])

  // Initialize canvas and positions
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawColorSpectrum()
      
      // Set initial positions based on colors
      const canvas = canvasRef.current
      const pos1 = hexToPosition(color1, canvas.width, canvas.height)
      const pos2 = hexToPosition(color2, canvas.width, canvas.height)
      setPosition1(pos1)
      setPosition2(pos2)
    }
  }, [isOpen, drawColorSpectrum, color1, color2])

  // Update colors when they change (throttled)
  useEffect(() => {
    throttledUpdate()
  }, [color1, color2, throttledUpdate])

  // Handle canvas interactions
  const handleCanvasInteraction = (e: React.MouseEvent, isDrag = false) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 1))
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 1))

    // Determine which color to update based on proximity or dragging state
    let colorToUpdate: 1 | 2

    if (isDragging) {
      colorToUpdate = isDragging
    } else {
      // Find which position is closer to the click
      const dist1 = Math.sqrt(Math.pow(x - position1.x, 2) + Math.pow(y - position1.y, 2))
      const dist2 = Math.sqrt(Math.pow(x - position2.x, 2) + Math.pow(y - position2.y, 2))
      colorToUpdate = dist1 <= dist2 ? 1 : 2
    }

    // Update the selected color and position
    const newHex = positionToHex({ x, y }, canvas.width, canvas.height)
    
    if (colorToUpdate === 1) {
      setColor1(newHex)
      setColor1Hex(newHex)
      setPosition1({ x, y })
    } else {
      setColor2(newHex)
      setColor2Hex(newHex)
      setPosition2({ x, y })
    }
    
    if (isDrag) setIsDragging(colorToUpdate)
  }

  // Handle hex input changes
  const handleColor1HexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setColor1Hex(hex)
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setColor1(hex)
      if (canvasRef.current) {
        const pos = hexToPosition(hex, canvasRef.current.width, canvasRef.current.height)
        setPosition1(pos)
      }
      document.documentElement.style.setProperty('--c1', hex)
    }
  }

  const handleColor2HexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setColor2Hex(hex)
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setColor2(hex)
      if (canvasRef.current) {
        const pos = hexToPosition(hex, canvasRef.current.width, canvasRef.current.height)
        setPosition2(pos)
      }
      document.documentElement.style.setProperty('--c2', hex)
    }
  }

  // Mouse event handlers for dragging
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(null)
    }

    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Handle save
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/users/id/${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          color1,
          color2
        }),
      })

      if (response.ok) {
        onSave(color1, color2)
        onClose()
      } else {
        console.error('Failed to save colors')
      }
    } catch (error) {
      console.error('Error saving colors:', error)
    }
  }

  // Handle close (restore original colors)
  const handleClose = () => {
    setColor1(initialColor1)
    setColor2(initialColor2)
    setColor1Hex(initialColor1)
    setColor2Hex(initialColor2)
    document.documentElement.style.setProperty('--c1', initialColor1)
    document.documentElement.style.setProperty('--c2', initialColor2)
    onClose()
  }

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div 
        className="p-8 shadow-lg type-small"
        style={{ 
          backgroundColor: `var(--c1, #000000)`,
          color: `var(--c2, #ffffff)`,
          borderRadius: '0.5rem',
          width: '500px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="type-large mb-6 text-center">Color Picker</h2>
        
        {/* Single Color Picker Canvas */}
        <div className="relative mb-6">
          <canvas
            ref={canvasRef}
            width={420}
            height={280}
            className="w-full cursor-crosshair rounded"
            onClick={(e) => handleCanvasInteraction(e)}
            onMouseDown={(e) => handleCanvasInteraction(e, true)}
            onMouseMove={(e) => isDragging && handleCanvasInteraction(e, true)}
          />
          
          {/* Position indicator for Color 1 */}
          <div
            className="absolute w-8 h-8 rounded-full flex items-center justify-center text-black font-bold pointer-events-none type-small"
            style={{
              left: position1.x - 16,
              top: position1.y - 16,
              backgroundColor: 'white'
            }}
          >
            1
          </div>
          
          {/* Position indicator for Color 2 */}
          <div
            className="absolute w-8 h-8 rounded-full flex items-center justify-center text-black font-bold pointer-events-none type-small"
            style={{
              left: position2.x - 16,
              top: position2.y - 16,
              backgroundColor: 'white'
            }}
          >
            2
          </div>
        </div>

        {/* Hex inputs */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={color1Hex}
            onChange={handleColor1HexChange}
            className="flex-1 p-3 rounded type-small"
            style={{
              backgroundColor: `var(--c2, #ffffff)`,
              color: `var(--c1, #000000)`
            }}
            placeholder="Color 1"
            maxLength={7}
          />
          <input
            type="text"
            value={color2Hex}
            onChange={handleColor2HexChange}
            className="flex-1 p-3 rounded type-small"
            style={{
              backgroundColor: `var(--c2, #ffffff)`,
              color: `var(--c1, #000000)`
            }}
            placeholder="Color 2"
            maxLength={7}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 h-12 rounded hover:opacity-80 transition-opacity type-large"
            style={{
              backgroundColor: `var(--c2, #ffffff)`,
              color: `var(--c1, #000000)`
            }}
          >
            Save
          </button>
          <button
            onClick={handleClose}
            className="flex-1 h-12 rounded border-2 hover:opacity-80 transition-opacity type-large"
            style={{
              backgroundColor: 'transparent',
              color: `var(--c2, #ffffff)`,
              borderColor: `var(--c2, #ffffff)`
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
} 