'use client'

import UniversalLawAreaAdmin from '@/components/admin/UniversalLawAreaAdmin'
import { getLawAreaBySlug } from '@/data/law-areas-config'

export default function CriminalLawAdminPage() {
  const lawAreaConfig = getLawAreaBySlug('criminal-law')

  if (!lawAreaConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Configuration Error</h1>
          <p className="text-gray-600">Criminal Law configuration not found.</p>
        </div>
      </div>
    )
  }

  return <UniversalLawAreaAdmin lawAreaConfig={lawAreaConfig} />
}