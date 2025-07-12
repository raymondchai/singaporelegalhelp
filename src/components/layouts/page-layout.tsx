'use client'

import { ReactNode } from 'react'
import Navigation from '@/components/Navigation'
import { PageHeader } from '@/components/ui/page-header'
import { BreadcrumbItem } from '@/components/ui/breadcrumbs'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  showNavigation?: boolean
  showHeader?: boolean
  backButton?: {
    href?: string
    label?: string
    onClick?: () => void
  }
  breadcrumbs?: BreadcrumbItem[]
  headerActions?: ReactNode
  className?: string
  containerClassName?: string
}

export function PageLayout({
  children,
  title,
  subtitle,
  showNavigation = true,
  showHeader = true,
  backButton,
  breadcrumbs,
  headerActions,
  className,
  containerClassName
}: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100", className)}>
      {/* Navigation */}
      {showNavigation && <Navigation />}

      {/* Page Header */}
      {showHeader && title && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          backButton={backButton}
          breadcrumbs={breadcrumbs}
          actions={headerActions}
        />
      )}

      {/* Main Content */}
      <main className={cn("container mx-auto px-4 py-8", containerClassName)}>
        {children}
      </main>
    </div>
  )
}
