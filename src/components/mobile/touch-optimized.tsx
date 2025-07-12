'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react'

// Touch-optimized button with larger touch targets
interface TouchButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export function TouchButton({ 
  children, 
  onClick, 
  variant = 'default',
  size = 'md',
  disabled = false,
  className = ''
}: TouchButtonProps) {
  const sizeClasses = {
    sm: 'min-h-[44px] px-4 py-2 text-sm',
    md: 'min-h-[48px] px-6 py-3 text-base',
    lg: 'min-h-[52px] px-8 py-4 text-lg'
  }

  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClasses[size]} touch-manipulation ${className}`}
    >
      {children}
    </Button>
  )
}

// Swipeable card component
interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: {
    icon: ReactNode
    label: string
    color: string
  }
  rightAction?: {
    icon: ReactNode
    label: string
    color: string
  }
  className?: string
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className = ''
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    
    // Limit swipe distance
    const maxSwipe = 120
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff))
    setTranslateX(limitedDiff)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    const threshold = 60
    
    if (translateX > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (translateX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
    
    setTranslateX(0)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background Actions */}
      {(leftAction || rightAction) && (
        <div className="absolute inset-0 flex">
          {rightAction && (
            <div className={`flex items-center justify-center w-24 ${rightAction.color}`}>
              <div className="text-center text-white">
                {rightAction.icon}
                <div className="text-xs mt-1">{rightAction.label}</div>
              </div>
            </div>
          )}
          <div className="flex-1" />
          {leftAction && (
            <div className={`flex items-center justify-center w-24 ${leftAction.color}`}>
              <div className="text-center text-white">
                {leftAction.icon}
                <div className="text-xs mt-1">{leftAction.label}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      <Card
        ref={cardRef}
        className={`transition-transform duration-200 ${className}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </Card>
    </div>
  )
}

// Pull-to-refresh component
interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  refreshThreshold?: number
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
  className = ''
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY
    
    if (diff > 0) {
      e.preventDefault()
      const dampedDistance = Math.min(diff * 0.5, refreshThreshold * 1.5)
      setPullDistance(dampedDistance)
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= refreshThreshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
  }

  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1)

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 transition-all duration-200 z-10"
          style={{ height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px` }}
        >
          <div className="flex items-center space-x-2 text-blue-600">
            <div 
              className={`w-6 h-6 border-2 border-blue-600 rounded-full ${
                isRefreshing ? 'animate-spin border-t-transparent' : ''
              }`}
              style={{
                transform: `rotate(${refreshProgress * 360}deg)`,
                borderTopColor: refreshProgress >= 1 ? 'transparent' : undefined
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing ? 'Refreshing...' : pullDistance >= refreshThreshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}

// Horizontal scrollable list
interface HorizontalScrollListProps {
  children: ReactNode[]
  itemWidth?: string
  gap?: string
  className?: string
  showScrollIndicators?: boolean
}

export function HorizontalScrollList({
  children,
  itemWidth = '280px',
  gap = '16px',
  className = '',
  showScrollIndicators = true
}: HorizontalScrollListProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const checkScrollability = () => {
    if (!scrollRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }

  useEffect(() => {
    checkScrollability()
  }, [children])

  const scrollLeft = () => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' })
  }

  return (
    <div className={`relative ${className}`}>
      {/* Scroll Indicators */}
      {showScrollIndicators && (
        <>
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 border"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 border"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </>
      )}

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide pb-2"
        style={{ gap }}
        onScroll={checkScrollability}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0"
            style={{ width: itemWidth }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

// Touch-optimized action sheet
interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  actions: Array<{
    label: string
    icon?: ReactNode
    onClick: () => void
    destructive?: boolean
  }>
}

export function ActionSheet({ isOpen, onClose, title, actions }: ActionSheetProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Action Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 animate-slide-up">
        {title && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-center">{title}</h3>
          </div>
        )}
        
        <div className="p-4 space-y-2">
          {actions.map((action, index) => (
            <TouchButton
              key={index}
              onClick={() => {
                action.onClick()
                onClose()
              }}
              variant={action.destructive ? 'destructive' : 'ghost'}
              className={`w-full justify-start ${action.destructive ? 'text-red-600' : ''}`}
            >
              <div className="flex items-center space-x-3">
                {action.icon}
                <span>{action.label}</span>
              </div>
            </TouchButton>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <TouchButton
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Cancel
          </TouchButton>
        </div>
      </div>
    </>
  )
}
