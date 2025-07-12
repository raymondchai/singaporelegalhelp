'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  Download,
  Receipt,
  Search,
  Filter,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Eye
} from 'lucide-react'
import { SubscriptionDetails } from '@/types/dashboard'
import { useAuth } from '@/contexts/auth-context'

interface BillingHistoryProps {
  subscription: SubscriptionDetails
}

interface Invoice {
  id: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  date: string
  invoiceNumber: string
  description: string
  invoiceUrl?: string
  paymentMethod?: string
  dueDate?: string
  paidDate?: string
  refundAmount?: number
  refundDate?: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
}

export default function BillingHistory({ subscription }: BillingHistoryProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    loadBillingHistory()
  }, [subscription.id])

  useEffect(() => {
    filterInvoices()
  }, [invoices, searchQuery, statusFilter, dateFilter])

  const loadBillingHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/billing/history?subscriptionId=${subscription.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error loading billing history:', error)
      toast({
        title: 'Error',
        description: 'Failed to load billing history',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterInvoices = () => {
    let filtered = [...invoices]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case '30d':
          filterDate.setDate(now.getDate() - 30)
          break
        case '90d':
          filterDate.setDate(now.getDate() - 90)
          break
        case '1y':
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(invoice => new Date(invoice.date) >= filterDate)
      }
    }

    setFilteredInvoices(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'refunded':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Receipt className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number, currency: string = 'SGD') => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      if (invoice.invoiceUrl) {
        window.open(invoice.invoiceUrl, '_blank')
      } else {
        // Generate and download invoice
        const response = await fetch(`/api/billing/invoice/${invoice.id}/download`)
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `invoice-${invoice.invoiceNumber}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download invoice',
        variant: 'destructive'
      })
    }
  }

  const calculateTotalSpent = () => {
    return invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((total, invoice) => total + invoice.amount, 0)
  }

  const getPaymentMethodIcon = (method?: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
      case 'stripe':
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
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
    <div className="space-y-6">
      {/* Billing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Receipt className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-sm text-gray-600">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(calculateTotalSpent())}</p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </p>
                <p className="text-sm text-gray-600">Paid Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices List */}
          <div className="space-y-4">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-500">
                  {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Your billing history will appear here'
                  }
                </p>
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(invoice.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{invoice.invoiceNumber}</h3>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{invoice.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(invoice.date)}
                          </span>
                          {invoice.paymentMethod && (
                            <span className="flex items-center gap-1">
                              {getPaymentMethodIcon(invoice.paymentMethod)}
                              {invoice.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.amount, invoice.currency)}</p>
                        {invoice.status === 'refunded' && invoice.refundAmount && (
                          <p className="text-sm text-orange-600">
                            Refunded: {formatCurrency(invoice.refundAmount, invoice.currency)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoice(invoice)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details (Expandable) */}
                  {selectedInvoice?.id === invoice.id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Invoice Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Invoice Number:</span>
                              <span>{invoice.invoiceNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Issue Date:</span>
                              <span>{formatDate(invoice.date)}</span>
                            </div>
                            {invoice.dueDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Due Date:</span>
                                <span>{formatDate(invoice.dueDate)}</span>
                              </div>
                            )}
                            {invoice.paidDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Paid Date:</span>
                                <span>{formatDate(invoice.paidDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Line Items</h4>
                          <div className="space-y-1 text-sm">
                            {invoice.items.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="text-gray-600">
                                  {item.description} × {item.quantity}
                                </span>
                                <span>{formatCurrency(item.amount, invoice.currency)}</span>
                              </div>
                            ))}
                            <div className="border-t pt-1 mt-2">
                              <div className="flex justify-between font-medium">
                                <span>Total</span>
                                <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
