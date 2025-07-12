'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Shield,
  Calendar,
  Building,
  Smartphone,
  Wallet,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { SubscriptionDetails } from '@/types/dashboard'
import { useAuth } from '@/contexts/auth-context'

interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'nets' | 'paynow' | 'grabpay'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  isExpired?: boolean
  bankName?: string
  accountType?: string
  phoneNumber?: string
  email?: string
}

interface PaymentMethodsProps {
  subscription: SubscriptionDetails
  onPaymentMethodUpdate: () => void
}

export default function PaymentMethods({ subscription, onPaymentMethodUpdate }: PaymentMethodsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addingMethod, setAddingMethod] = useState(false)

  useEffect(() => {
    loadPaymentMethods()
  }, [subscription.id])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payment-methods?subscriptionId=${subscription.id}`)
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodIcon = (type: string, brand?: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5 text-blue-600" />
      case 'bank':
        return <Building className="h-5 w-5 text-green-600" />
      case 'nets':
        return <CreditCard className="h-5 w-5 text-red-600" />
      case 'paynow':
        return <Smartphone className="h-5 w-5 text-purple-600" />
      case 'grabpay':
        return <Wallet className="h-5 w-5 text-green-600" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />
    }
  }

  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return `${method.brand?.toUpperCase()} •••• ${method.last4}`
      case 'bank':
        return `${method.bankName} ${method.accountType}`
      case 'nets':
        return `NETS •••• ${method.last4}`
      case 'paynow':
        return `PayNow ${method.phoneNumber || method.email}`
      case 'grabpay':
        return `GrabPay ${method.phoneNumber}`
      default:
        return 'Unknown Payment Method'
    }
  }

  const getExpiryStatus = (method: PaymentMethod) => {
    if (!method.expiryMonth || !method.expiryYear) return null
    
    const now = new Date()
    const expiry = new Date(method.expiryYear, method.expiryMonth - 1)
    const monthsUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
    
    if (monthsUntilExpiry < 0) {
      return { status: 'expired', message: 'Expired', color: 'text-red-600' }
    } else if (monthsUntilExpiry < 2) {
      return { status: 'expiring', message: 'Expires Soon', color: 'text-yellow-600' }
    }
    return null
  }

  const handleSetDefault = async (methodId: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${methodId}/set-default`, {
        method: 'POST'
      })

      if (response.ok) {
        setPaymentMethods(prev => prev.map(method => ({
          ...method,
          isDefault: method.id === methodId
        })))
        onPaymentMethodUpdate()
        toast({
          title: 'Success',
          description: 'Default payment method updated'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update default payment method',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteMethod = async (methodId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return
    }

    try {
      const response = await fetch(`/api/payment-methods/${methodId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPaymentMethods(prev => prev.filter(method => method.id !== methodId))
        onPaymentMethodUpdate()
        toast({
          title: 'Success',
          description: 'Payment method deleted'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete payment method',
        variant: 'destructive'
      })
    }
  }

  const handleAddPaymentMethod = async (type: string) => {
    setAddingMethod(true)
    try {
      // This would integrate with Stripe Elements or other payment processors
      // For now, we'll simulate the process
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subscriptionId: subscription.id
        })
      })

      if (response.ok) {
        await loadPaymentMethods()
        setShowAddDialog(false)
        onPaymentMethodUpdate()
        toast({
          title: 'Success',
          description: 'Payment method added successfully'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add payment method',
        variant: 'destructive'
      })
    } finally {
      setAddingMethod(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose a payment method to add to your account
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleAddPaymentMethod('card')}
                  disabled={addingMethod}
                  className="justify-start h-auto p-4"
                >
                  <CreditCard className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500">Visa, Mastercard, AMEX</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleAddPaymentMethod('nets')}
                  disabled={addingMethod}
                  className="justify-start h-auto p-4"
                >
                  <CreditCard className="h-5 w-5 mr-3 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium">NETS</div>
                    <div className="text-sm text-gray-500">Singapore's local payment</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleAddPaymentMethod('paynow')}
                  disabled={addingMethod}
                  className="justify-start h-auto p-4"
                >
                  <Smartphone className="h-5 w-5 mr-3 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">PayNow</div>
                    <div className="text-sm text-gray-500">Instant bank transfer</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleAddPaymentMethod('grabpay')}
                  disabled={addingMethod}
                  className="justify-start h-auto p-4"
                >
                  <Wallet className="h-5 w-5 mr-3 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">GrabPay</div>
                    <div className="text-sm text-gray-500">Digital wallet</div>
                  </div>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
            <p className="text-gray-500 mb-4">Add a payment method to manage your subscription</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => {
              const expiryStatus = getExpiryStatus(method)
              
              return (
                <div key={method.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getPaymentMethodIcon(method.type, method.brand)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{getPaymentMethodName(method)}</h3>
                          {method.isDefault && (
                            <Badge className="bg-green-100 text-green-800">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          {expiryStatus && (
                            <Badge variant="outline" className={expiryStatus.color}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {expiryStatus.message}
                            </Badge>
                          )}
                        </div>
                        
                        {method.expiryMonth && method.expiryYear && (
                          <p className="text-sm text-gray-600">
                            Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMethod(method.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={method.isDefault && paymentMethods.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>Your payment information is securely encrypted and stored</span>
                  </div>
                </div>
              )
            })}

            {/* Payment Security Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Secure Payments</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    All payment information is encrypted and processed securely through our certified payment partners. 
                    We never store your complete card details on our servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
