'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CreditCard,
  Download,
  ArrowLeft,
  Info,
  Calendar,
  DollarSign,
  FileText,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function BillingHistoryPage() {
  const router = useRouter()

  // Mock data for demonstration
  const mockInvoices = [
    {
      id: 'INV-2024-001',
      date: '2024-12-01',
      amount: 29.90,
      status: 'paid',
      plan: 'Premium Individual',
      period: 'December 2024'
    },
    {
      id: 'INV-2024-002',
      date: '2024-11-01',
      amount: 29.90,
      status: 'paid',
      plan: 'Premium Individual',
      period: 'November 2024'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return { variant: 'default' as const, label: 'Paid', className: 'bg-green-100 text-green-800' }
      case 'pending':
        return { variant: 'secondary' as const, label: 'Pending', className: 'bg-yellow-100 text-yellow-800' }
      case 'overdue':
        return { variant: 'destructive' as const, label: 'Overdue', className: 'bg-red-100 text-red-800' }
      default:
        return { variant: 'outline' as const, label: status, className: '' }
    }
  }

  return (
    <DashboardLayout
      title="Billing History"
      subtitle="View your payment history and download invoices"
      actions={
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/subscription">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscription
            </Button>
          </Link>
          <Button disabled>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Coming Soon Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Full billing history is coming soon!</strong> We're working on integrating comprehensive billing management with invoice downloads and payment tracking.
          </AlertDescription>
        </Alert>

        {/* Billing Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S$59.80</div>
              <p className="text-xs text-gray-600">Last 12 months</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Total Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-gray-600">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Next Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Jan 1</div>
              <p className="text-xs text-gray-600">S$29.90</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Invoice History</span>
            </CardTitle>
            <CardDescription>
              Your payment history and invoice details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{invoice.id}</div>
                      <div className="text-sm text-gray-600">{invoice.plan} - {invoice.period}</div>
                      <div className="text-xs text-gray-500">{invoice.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">S${invoice.amount}</div>
                      <Badge className={getStatusBadge(invoice.status).className}>
                        {getStatusBadge(invoice.status).label}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coming Soon Features */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Coming Soon Features</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Download invoices as PDF</li>
                <li>• Export billing history to CSV</li>
                <li>• Payment method management</li>
                <li>• Automatic invoice notifications</li>
                <li>• Tax reporting summaries</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Manage your payment methods and billing preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">•••• •••• •••• 4242</div>
                    <div className="text-sm text-gray-600">Expires 12/25</div>
                  </div>
                </div>
                <Badge>Primary</Badge>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="outline" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
                <Button variant="outline" disabled>
                  Update Billing Info
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Questions about your billing or need assistance?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Our support team is here to help with any billing questions or concerns.
            </p>
            <div className="flex items-center space-x-3">
              <Link href="/dashboard/subscription">
                <Button>
                  Manage Subscription
                </Button>
              </Link>
              <Button variant="outline" disabled>
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
