'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, FileText, Download, Eye, CheckCircle, Clock } from 'lucide-react'

interface UserProfile {
  id: string
  pdpa_consent_date?: string
  terms_accepted_date?: string
  privacy_policy_accepted_date?: string
}

interface ComplianceTabProps {
  userProfile: UserProfile
  onUpdate: (profile: UserProfile) => void
}

export function ComplianceTab({ userProfile }: ComplianceTabProps) {
  const complianceItems = [
    {
      title: 'PDPA Consent',
      description: 'Personal Data Protection Act compliance',
      date: userProfile.pdpa_consent_date,
      status: userProfile.pdpa_consent_date ? 'compliant' : 'pending',
    },
    {
      title: 'Terms & Conditions',
      description: 'Platform terms and conditions acceptance',
      date: userProfile.terms_accepted_date,
      status: userProfile.terms_accepted_date ? 'compliant' : 'pending',
    },
    {
      title: 'Privacy Policy',
      description: 'Privacy policy acknowledgment',
      date: userProfile.privacy_policy_accepted_date,
      status: userProfile.privacy_policy_accepted_date ? 'compliant' : 'pending',
    },
  ]

  const getStatusBadge = (status: string) => {
    return status === 'compliant' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Compliant
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Compliance Status</span>
          </CardTitle>
          <CardDescription>
            Your compliance status with Singapore legal requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  {item.date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted: {new Date(item.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(item.status)}
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
          <CardDescription>
            Manage your personal data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              Download My Data
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Privacy Settings
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Your Rights Under PDPA</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Right to access your personal data</li>
              <li>• Right to correct inaccurate data</li>
              <li>• Right to withdraw consent</li>
              <li>• Right to data portability</li>
            </ul>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-900 mb-2">Account Deletion</h4>
            <p className="text-sm text-red-800 mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" size="sm">
              Request Account Deletion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
