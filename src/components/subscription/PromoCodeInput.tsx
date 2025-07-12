'use client'

// =====================================================
// Phase 6A: Promotional Code Input Component
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Tag, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Percent,
  DollarSign
} from 'lucide-react'
import { SubscriptionTier, BillingCycle, formatPrice } from '@/lib/subscription-config'

interface PromoCodeInputProps {
  userId: string
  tier: SubscriptionTier
  billingCycle: BillingCycle
  originalAmount: number
  onPromoApplied: (discount: PromoDiscount) => void
  onPromoRemoved: () => void
  disabled?: boolean
}

interface PromoDiscount {
  promoCodeId: string
  code: string
  name: string
  description: string
  discountType: 'percentage' | 'fixed_amount'
  discountValue: number
  discountAmount: number
  finalAmount: number
  savings: number
}

export function PromoCodeInput({
  userId,
  tier,
  billingCycle,
  originalAmount,
  onPromoApplied,
  onPromoRemoved,
  disabled = false
}: PromoCodeInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const validatePromoCode = async () => {
    if (!code.trim()) {
      setError('Please enter a promotional code')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          userId,
          tier,
          billingCycle,
          amount: originalAmount,
        }),
      })

      const data = await response.json()

      if (data.valid) {
        const discount: PromoDiscount = {
          promoCodeId: data.promoCode.id,
          code: data.promoCode.code,
          name: data.promoCode.name,
          description: data.promoCode.description,
          discountType: data.promoCode.discount_type,
          discountValue: data.promoCode.discount_value,
          discountAmount: data.discount.amount,
          finalAmount: data.discount.final_amount,
          savings: data.discount.savings,
        }

        setAppliedPromo(discount)
        setSuccess(data.message)
        onPromoApplied(discount)
        setCode('')
      } else {
        setError(data.message || 'Invalid promotional code')
      }

    } catch (err: any) {
      setError('Failed to validate promotional code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const removePromoCode = () => {
    setAppliedPromo(null)
    setError(null)
    setSuccess(null)
    onPromoRemoved()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !disabled) {
      validatePromoCode()
    }
  }

  return (
    <div className="space-y-4">
      {/* Applied Promo Code Display */}
      {appliedPromo && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">{appliedPromo.code}</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {appliedPromo.discountType === 'percentage' ? (
                    <div className="flex items-center space-x-1">
                      <Percent className="h-3 w-3" />
                      <span>{appliedPromo.discountValue}% off</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>{formatPrice(appliedPromo.discountValue)} off</span>
                    </div>
                  )}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removePromoCode}
                disabled={disabled}
                className="text-green-700 hover:text-green-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-green-700">{appliedPromo.name}</p>
              {appliedPromo.description && (
                <p className="text-xs text-green-600 mt-1">{appliedPromo.description}</p>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Original amount:</span>
                <span className="text-green-700">{formatPrice(originalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Discount:</span>
                <span className="text-green-700">-{formatPrice(appliedPromo.discountAmount)}</span>
              </div>
              <div className="flex justify-between font-medium text-green-800 border-t border-green-200 pt-1 mt-1">
                <span>Final amount:</span>
                <span>{formatPrice(appliedPromo.finalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promo Code Input */}
      {!appliedPromo && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Tag className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Have a promotional code?</span>
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Enter promotional code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                disabled={loading || disabled}
                className="flex-1"
              />
              <Button
                onClick={validatePromoCode}
                disabled={loading || disabled || !code.trim()}
                size="sm"
              >
                {loading ? 'Validating...' : 'Apply'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {success && !appliedPromo && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
