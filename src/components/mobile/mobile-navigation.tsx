'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBackgroundSync } from '@/hooks/use-background-sync'
import { 
  Home, 
  Search, 
  FileText, 
  MessageCircle, 
  User,
  Menu,
  X,
  Bell,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react'

interface MobileNavigationProps {
  className?: string
}

export function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { hasPendingChanges } = useBackgroundSync()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const navigationItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/',
      badge: null
    },
    {
      icon: Search,
      label: 'Search',
      href: '/search',
      badge: null
    },
    {
      icon: FileText,
      label: 'Documents',
      href: '/dashboard/documents',
      badge: hasPendingChanges() ? 'sync' : null
    },
    {
      icon: MessageCircle,
      label: 'Chat',
      href: '/chat',
      badge: null
    },
    {
      icon: User,
      label: 'Profile',
      href: '/dashboard/profile',
      badge: null
    }
  ]

  const menuItems = [
    {
      icon: Bell,
      label: 'Notifications',
      href: '/dashboard/notifications'
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/dashboard/settings'
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      href: '/contact'
    },
    {
      icon: LogOut,
      label: 'Sign Out',
      href: '/auth/logout'
    }
  ]

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const getBadgeContent = (badge: string | null) => {
    switch (badge) {
      case 'sync':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      default:
        return null
    }
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 ${className}`}>
        <div className="flex items-center justify-around py-2 px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[60px] relative ${
                  active 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && (
                    <div className="absolute -top-1 -right-1">
                      {getBadgeContent(item.badge)}
                    </div>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            )
          })}
          
          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[60px] text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 transform transition-transform">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    
                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className="flex items-center space-x-3 w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
                      >
                        <Icon className="h-5 w-5 text-gray-500" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 text-center">
                  Singapore Legal Help v1.0
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// Hook for mobile navigation state
export function useMobileNavigation() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide navigation when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return { isVisible }
}

// Mobile-optimized page wrapper
export function MobilePage({ 
  children, 
  title,
  showNavigation = true,
  className = ''
}: {
  children: React.ReactNode
  title?: string
  showNavigation?: boolean
  className?: string
}) {
  const { isVisible } = useMobileNavigation()

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {title && (
        <div className="sticky top-0 bg-white border-b border-gray-200 z-30 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
      )}
      
      <main className={`${showNavigation ? 'pb-20' : ''}`}>
        {children}
      </main>
      
      {showNavigation && (
        <div className={`transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <MobileNavigation />
        </div>
      )}
    </div>
  )
}
