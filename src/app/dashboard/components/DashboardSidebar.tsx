'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Scale,
  LayoutDashboard,
  FileText,
  MessageCircle,
  Bookmark,
  BarChart3,
  CreditCard,
  Settings,
  HelpCircle,
  X,
  Upload,
  History,
  FolderOpen,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    current: false,
  },
  {
    name: 'Document Builder',
    href: '/document-builder',
    icon: FileText,
    current: false,
  },
  {
    name: 'Documents',
    icon: FileText,
    current: false,
    children: [
      { name: 'All Documents', href: '/dashboard/documents' },
      { name: 'Upload Document', href: '/dashboard/documents/upload' },
    ],
  },
  {
    name: 'Chat History',
    href: '/dashboard/chat-history',
    icon: MessageCircle,
    current: false,
  },
  {
    name: 'Saved Content',
    icon: Bookmark,
    current: false,
    children: [
      { name: 'All Saved', href: '/dashboard/saved-content' },
      { name: 'Collections', href: '/dashboard/saved-content/collections' },
    ],
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    current: false,
  },
  {
    name: 'Subscription',
    icon: CreditCard,
    current: false,
    children: [
      { name: 'Current Plan', href: '/dashboard/subscription' },
      { name: 'Billing History', href: '/dashboard/billing-history' },
      { name: 'Upgrade Plan', href: '/dashboard/upgrade-plan' },
    ],
  },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help & Support', href: '/dashboard/help', icon: HelpCircle },
]

export default function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()

  const isCurrentPath = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href) || false
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Scale className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Singapore Legal Help
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      {!item.children ? (
                        <Link
                          href={item.href!}
                          className={cn(
                            isCurrentPath(item.href!)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                          )}
                        >
                          <item.icon
                            className={cn(
                              isCurrentPath(item.href!)
                                ? 'text-blue-700'
                                : 'text-gray-400 group-hover:text-blue-700',
                              'h-5 w-5 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ) : (
                        <div>
                          <div className="flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-gray-700">
                            <item.icon
                              className="h-5 w-5 shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                            {item.name}
                          </div>
                          <ul className="mt-1 px-2">
                            {item.children.map((subItem) => (
                              <li key={subItem.name}>
                                <Link
                                  href={subItem.href}
                                  className={cn(
                                    isCurrentPath(subItem.href)
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50',
                                    'block rounded-md py-2 pl-6 pr-2 text-sm leading-6'
                                  )}
                                >
                                  {subItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </li>

              {/* Secondary navigation */}
              <li className="mt-auto">
                <ul role="list" className="-mx-2 space-y-1">
                  {secondaryNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isCurrentPath(item.href)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isCurrentPath(item.href)
                              ? 'text-blue-700'
                              : 'text-gray-400 group-hover:text-blue-700',
                            'h-5 w-5 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-y-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:hidden',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          {/* Mobile header with close button */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Singapore Legal Help
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile navigation - same as desktop */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      {!item.children ? (
                        <Link
                          href={item.href!}
                          onClick={onClose}
                          className={cn(
                            isCurrentPath(item.href!)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                          )}
                        >
                          <item.icon
                            className={cn(
                              isCurrentPath(item.href!)
                                ? 'text-blue-700'
                                : 'text-gray-400 group-hover:text-blue-700',
                              'h-5 w-5 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ) : (
                        <div>
                          <div className="flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-gray-700">
                            <item.icon
                              className="h-5 w-5 shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                            {item.name}
                          </div>
                          <ul className="mt-1 px-2">
                            {item.children.map((subItem) => (
                              <li key={subItem.name}>
                                <Link
                                  href={subItem.href}
                                  onClick={onClose}
                                  className={cn(
                                    isCurrentPath(subItem.href)
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50',
                                    'block rounded-md py-2 pl-6 pr-2 text-sm leading-6'
                                  )}
                                >
                                  {subItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </li>

              {/* Secondary navigation */}
              <li className="mt-auto">
                <ul role="list" className="-mx-2 space-y-1">
                  {secondaryNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          isCurrentPath(item.href)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isCurrentPath(item.href)
                              ? 'text-blue-700'
                              : 'text-gray-400 group-hover:text-blue-700',
                            'h-5 w-5 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
