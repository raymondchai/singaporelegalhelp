'use client'


import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, Users, FileText, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

export default function HomePage() {
  const { user, loading } = useAuth()

  // Remove auto-redirect - let users choose where to go

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Singapore Legal Help</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="/legal-categories" className="text-gray-600 hover:text-blue-600">Legal Areas</Link>
            <Link href="/services" className="text-gray-600 hover:text-blue-600">Services</Link>
            <Link href="/about" className="text-gray-600 hover:text-blue-600">About</Link>
            <Link href="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link>
          </nav>
          <div className="flex space-x-2">
            {user ? (
              <>
                <Button variant="outline" asChild>
                  <Link href="/legal-categories">Explore Legal Areas</Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/auth/login?from=homepage">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Legal Assistance for Singapore
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get expert legal advice, document assistance, and comprehensive support for all your Singapore law matters. 
            Our AI-powered platform provides instant, accurate, and affordable legal help.
          </p>
          <div className="flex justify-center space-x-4">
            {user ? (
              <>
                <Button size="lg" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/legal-categories">Browse Legal Areas</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/auth/register">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/demo">Watch Demo</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Comprehensive Legal Solutions
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <FileText className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Document Analysis</CardTitle>
                <CardDescription>
                  Upload and analyze legal documents with AI-powered insights and recommendations.
                </CardDescription>
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link href={user ? "/dashboard/documents" : "/auth/register"}>
                      {user ? "Upload Documents" : "Get Started"}
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Legal Q&A</CardTitle>
                <CardDescription>
                  Get instant answers to your legal questions from our comprehensive Singapore law database.
                </CardDescription>
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link href={user ? "/chat" : "/demo"}>
                      {user ? "Start Chat" : "Try Demo"}
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Expert Consultation</CardTitle>
                <CardDescription>
                  Connect with qualified Singapore lawyers for complex legal matters and personalized advice.
                </CardDescription>
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/contact">
                      Contact Lawyers
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Legal Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Legal Practice Areas
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Business Law', slug: 'corporate-law' },
              { name: 'Employment Law', slug: 'employment-law' },
              { name: 'Property Law', slug: 'property-law' },
              { name: 'Family Law', slug: 'family-law' },
              { name: 'Criminal Law', slug: 'criminal-law' },
              { name: 'Intellectual Property', slug: 'intellectual-property-law' },
              { name: 'Immigration Law', slug: 'immigration-law' },
              { name: 'Tax Law', slug: 'tax-law' }
            ].map((area) => (
              <Link key={area.name} href={`/legal-categories/${area.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Explore {area.name.toLowerCase()} resources
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild>
              <Link href="/legal-categories">View All Legal Areas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Scale className="h-6 w-6" />
                <span className="text-xl font-bold">Singapore Legal Help</span>
              </div>
              <p className="text-gray-400">
                AI-powered legal assistance for Singapore law matters.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/demo" className="hover:text-white transition-colors">Legal Q&A</Link></li>
                <li><Link href={user ? "/dashboard/documents" : "/auth/register"} className="hover:text-white transition-colors">Document Analysis</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Expert Consultation</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Legal Research</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal Areas</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/legal-categories/corporate-law" className="hover:text-white transition-colors">Business Law</Link></li>
                <li><Link href="/legal-categories/employment-law" className="hover:text-white transition-colors">Employment Law</Link></li>
                <li><Link href="/legal-categories/property-law" className="hover:text-white transition-colors">Property Law</Link></li>
                <li><Link href="/legal-categories/family-law" className="hover:text-white transition-colors">Family Law</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@singaporelegalhelp.com.sg" className="hover:text-white transition-colors">support@singaporelegalhelp.com.sg</a></li>
                <li><a href="tel:+6561234567" className="hover:text-white transition-colors">+65 6123 4567</a></li>
                <li>Singapore</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Singapore Legal Help. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
