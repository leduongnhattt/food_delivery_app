'use client'
import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { BASE_IMAGE_URL } from '@/lib/constants'

interface FloatingButtonProps {
  className?: string
  onOpen: () => void
}

export default function FloatingButton({ className = '', onOpen }: FloatingButtonProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const chatbotRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartPos = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(true)
    isDraggingRef.current = true
    
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
    
    // Keep within viewport bounds
    const buttonSize = 56
    const margin = 20 // Increased margin for better spacing
    const maxX = window.innerWidth - buttonSize - margin
    const maxY = window.innerHeight - buttonSize - margin
    
    setPosition({
      x: Math.max(margin, Math.min(newX, maxX)),
      y: Math.max(margin, Math.min(newY, maxY))
    })
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(false)
    isDraggingRef.current = false
    
    // Simple click detection - if not much movement, it's a click
    const dragDistance = Math.abs(e.clientX - (e.clientX - dragStartPos.current.x)) + 
                        Math.abs(e.clientY - (e.clientY - dragStartPos.current.y))
    
    if (dragDistance < 5) { // 5px threshold for click vs drag
      onOpen()
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only open if not dragging
    if (!isDraggingRef.current) {
      onOpen()
    }
  }

  // Global mouse event handlers for smooth dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault()
        
        // Calculate new position
        const newX = e.clientX - dragStartPos.current.x
        const newY = e.clientY - dragStartPos.current.y
        
        // Keep within viewport bounds
        const buttonSize = 56
        const margin = 20 // Increased margin for better spacing
        const maxX = window.innerWidth - buttonSize - margin
        const maxY = window.innerHeight - buttonSize - margin
        
        setPosition({
          x: Math.max(margin, Math.min(newX, maxX)),
          y: Math.max(margin, Math.min(newY, maxY))
        })
      }
    }
    
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault()
        setIsDragging(false)
        isDraggingRef.current = false
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
      // Set specific position: x=1442, y=600
      setPosition({
        x: 1442,
        y: 600
      })
    }
    
    setDefaultPosition()
    
    const handleResize = () => {
      const buttonSize = 56
      const margin = 20
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - buttonSize - margin),
        y: Math.min(prev.y, window.innerHeight - buttonSize - margin)
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
        
        // Calculate new position
        const newX = touch.clientX - dragStartPos.current.x
        const newY = touch.clientY - dragStartPos.current.y
        
        // Keep within viewport bounds
        const buttonSize = 56
        const margin = 20 // Increased margin for better spacing
        const maxX = window.innerWidth - buttonSize - margin
        const maxY = window.innerHeight - buttonSize - margin
        
        setPosition({
          x: Math.max(margin, Math.min(newX, maxX)),
          y: Math.max(margin, Math.min(newY, maxY))
        })
      }}
      onTouchEnd={(e) => {
        if (!isDraggingRef.current) return
        
        e.preventDefault()
        e.stopPropagation()
        
        setIsDragging(false)
        isDraggingRef.current = false
        
        // Check if it was a tap (not drag)
        const touch = e.changedTouches[0]
        const dragDistance = Math.abs(touch.clientX - (touch.clientX - dragStartPos.current.x)) + 
                            Math.abs(touch.clientY - (touch.clientY - dragStartPos.current.y))
        
        if (dragDistance < 10) { // 10px threshold for tap vs drag
          onOpen()
        }
      }}
    >
      <div 
        className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-pink-200 touch-none"
        style={{
          willChange: 'transform, box-shadow',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isDragging 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transition: isDragging ? 'none' : 'all 0.2s ease-out'
        }}
      >
        <Image 
          src={`${BASE_IMAGE_URL}/logo.png`}
          alt="Health Assistant"
          width={40}
          height={40}
          className="w-10 h-10 object-contain pointer-events-none"
          style={{ willChange: 'transform' }}
          priority
        />
      </div>
      
      {/* Pulse animation - only when not dragging */}
      {!isDragging && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full animate-ping opacity-30 pointer-events-none"></div>
      )}
    </div>
  )
}