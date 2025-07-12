'use client'

import { ReactNode } from 'react'
import { BackButton } from './back-button'
import { Breadcrumbs, BreadcrumbItem } from './breadcrumbs'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backButton?: {
    href?: string
    label?: string
    onClick?: () => void
  }
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  className?: string
  children?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  backButton,
  breadcrumbs,
  actions,
  className,
  children
}: PageHeaderProps) {
  return (
    <div className={cn("bg-white border-b border-gray-200", className)}>
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        {/* Back Button */}
        {backButton && (
          <div className="mb-4">
            <BackButton
              href={backButton.href}
              label={backButton.label}
              onClick={backButton.onClick}
            />
          </div>
        )}

        {/* Header Content */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                {subtitle}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center space-x-3 ml-4">
              {actions}
            </div>
          )}
        </div>

        {/* Additional content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
