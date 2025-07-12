'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BackButtonProps {
  href?: string
  label?: string
  onClick?: () => void
  variant?: 'default' | 'ghost' | 'outline'
  className?: string
}

export function BackButton({ 
  href, 
  label = 'Back', 
  onClick, 
  variant = 'ghost',
  className = ''
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  if (href && !onClick) {
    return (
      <Button variant={variant} asChild className={className}>
        <Link href={href} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {label}
        </Link>
      </Button>
    )
  }

  return (
    <Button 
      variant={variant} 
      onClick={handleClick}
      className={`flex items-center ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}
