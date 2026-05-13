'use client'
import React, { useState, useRef, useEffect } from 'react'
import { BotMessageSquare, X } from 'lucide-react'

interface FloatingButtonProps {
  className?: string
  onOpen: () => void
  onDismiss?: () => void
}

export default function FloatingButton({ className = '', onOpen, onDismiss }: FloatingButtonProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const chatbotRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const pointerStart = useRef({ x: 0, y: 0 })
  const hasMovedRef = useRef(false)
  const suppressClickRef = useRef(false)

  const BUTTON_H = 56
  const BUTTON_W = 56
  const MARGIN_BOTTOM = 20
  const MARGIN_RIGHT = 40

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(true)
    isDraggingRef.current = true
    pointerStart.current = { x: e.clientX, y: e.clientY }
    hasMovedRef.current = false
    suppressClickRef.current = false
    
    // Store initial mouse position relative to button
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // Calculate new position
    const newX = e.clientX - dragStartPos.current.x
    const newY = e.clientY - dragStartPos.current.y

    const moved =
      Math.abs(e.clientX - pointerStart.current.x) +
        Math.abs(e.clientY - pointerStart.current.y) >
      6
    if (moved) hasMovedRef.current = true
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - BUTTON_W - MARGIN_RIGHT
    const maxY = window.innerHeight - BUTTON_H - MARGIN_BOTTOM
    
    setPosition({
      x: Math.max(MARGIN_RIGHT, Math.min(newX, maxX)),
      y: Math.max(MARGIN_BOTTOM, Math.min(newY, maxY))
    })
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(false)
    isDraggingRef.current = false

    // If user dragged, suppress the subsequent click event.
    if (hasMovedRef.current) {
      suppressClickRef.current = true
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    // Only open if not dragging
    if (!isDraggingRef.current) onOpen()
  }

  // Global mouse event handlers for smooth dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault()

        const moved =
          Math.abs(e.clientX - pointerStart.current.x) +
            Math.abs(e.clientY - pointerStart.current.y) >
          6
        if (moved) hasMovedRef.current = true
        
        // Calculate new position
        const newX = e.clientX - dragStartPos.current.x
        const newY = e.clientY - dragStartPos.current.y
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - BUTTON_W - MARGIN_RIGHT
        const maxY = window.innerHeight - BUTTON_H - MARGIN_BOTTOM
        
        setPosition({
          x: Math.max(MARGIN_RIGHT, Math.min(newX, maxX)),
          y: Math.max(MARGIN_BOTTOM, Math.min(newY, maxY))
        })
      }
    }
    
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault()
        setIsDragging(false)
        isDraggingRef.current = false

        if (hasMovedRef.current) {
          suppressClickRef.current = true
        }
      }
    }
    
    // Add passive: false for better performance
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
    document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false })
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [])

  // Set default position to bottom right corner
  useEffect(() => {
    const setDefaultPosition = () => {
      setPosition((prev) => {
        // If already positioned (e.g. restored by future persistence), keep it.
        if (prev.x !== 0 || prev.y !== 0) return prev

        const x = Math.max(MARGIN_RIGHT, window.innerWidth - BUTTON_W - MARGIN_RIGHT)
        const y = Math.max(MARGIN_BOTTOM, window.innerHeight - BUTTON_H - MARGIN_BOTTOM)
        return { x, y }
      })
    }
    
    setDefaultPosition()
    
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - BUTTON_W - MARGIN_RIGHT),
        y: Math.min(prev.y, window.innerHeight - BUTTON_H - MARGIN_BOTTOM)
      }))
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      ref={chatbotRef}
      className={`fixed z-50 cursor-pointer select-none ${className}`}
      data-position="floating-button"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: 'auto',
        bottom: 'auto',
        margin: 0,
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        userSelect: 'none',
        willChange: 'transform',
        transformOrigin: 'center',
        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onTouchStart={(e) => {
        e.preventDefault()
        e.stopPropagation()
        
        const touch = e.touches[0]
        setIsDragging(true)
        isDraggingRef.current = true
        pointerStart.current = { x: touch.clientX, y: touch.clientY }
        hasMovedRef.current = false
        suppressClickRef.current = false
        
        // Store initial touch position relative to button
        dragStartPos.current = {
          x: touch.clientX - position.x,
          y: touch.clientY - position.y
        }
      }}
      onTouchMove={(e) => {
        if (!isDraggingRef.current) return
        
        e.preventDefault()
        e.stopPropagation()
        
        const touch = e.touches[0]

        const moved =
          Math.abs(touch.clientX - pointerStart.current.x) +
            Math.abs(touch.clientY - pointerStart.current.y) >
          10
        if (moved) hasMovedRef.current = true
        
        // Calculate new position
        const newX = touch.clientX - dragStartPos.current.x
        const newY = touch.clientY - dragStartPos.current.y
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - BUTTON_W - MARGIN_RIGHT
        const maxY = window.innerHeight - BUTTON_H - MARGIN_BOTTOM
        
        setPosition({
          x: Math.max(MARGIN_RIGHT, Math.min(newX, maxX)),
          y: Math.max(MARGIN_BOTTOM, Math.min(newY, maxY))
        })
      }}
      onTouchEnd={(e) => {
        if (!isDraggingRef.current) return
        
        e.preventDefault()
        e.stopPropagation()
        
        setIsDragging(false)
        isDraggingRef.current = false

        if (hasMovedRef.current) {
          suppressClickRef.current = true
          return
        }

        onOpen()
      }}
    >
      <div
        className="touch-none"
        style={{
          willChange: 'transform',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          transition: isDragging ? 'none' : 'all 0.2s ease-out',
        }}
      >
        <div className="relative flex items-center">
          {/* Simple round launcher */}
          <div
            className={[
              "relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xl ring-2 ring-white/70",
              !isDragging ? "animate-bounce" : null,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <BotMessageSquare className="h-6 w-6" aria-hidden />

            {onDismiss ? (
              <button
                type="button"
                aria-label="Hide AI Health"
                className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500 shadow ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDismiss()
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onTouchStart={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Pulse animation - only when not dragging */}
      {!isDragging && (
        <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-20 blur-xl pointer-events-none" />
      )}
    </div>
  )
}