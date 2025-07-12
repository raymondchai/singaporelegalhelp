'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, Users, Shield, Award, Globe, Clock } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Singapore Legal Help</span>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/legal-categories" className="text-gray-600 hover:text-blue-600">Legal Areas</Link>
            <Link href="/services" className="text-gray-600 hover:text-blue-600">Services</Link>
            <Link href="/about" className="text-blue-600 font-medium">About</Link>
            <Link href="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link>
          </nav>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            About Singapore Legal Help
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            We're revolutionizing legal assistance in Singapore through AI-powered technology, 
            making legal help accessible, affordable, and instant for everyone.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-8">
              To democratize legal assistance in Singapore by providing instant, accurate, and affordable 
              legal guidance through cutting-edge AI technology, while maintaining the highest standards 
              of legal accuracy and compliance with Singapore law.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Singapore Legal Help
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Singapore Law Focused</CardTitle>
                <CardDescription>
                  Specialized exclusively in Singapore legal system with up-to-date local regulations and procedures.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Clock className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Instant Assistance</CardTitle>
                <CardDescription>
                  Get immediate answers to your legal questions 24/7 without waiting for appointments.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Award className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Expert-Verified Content</CardTitle>
                <CardDescription>
                  All content reviewed and verified by qualified Singapore lawyers and legal professionals.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Commitment
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Legal Excellence</h3>
              <p className="text-gray-600 mb-6">
                Our platform is built with input from experienced Singapore lawyers and legal professionals. 
                We ensure all information is accurate, current, and compliant with Singapore legal standards.
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Technology Innovation</h3>
              <p className="text-gray-600 mb-6">
                We leverage advanced AI technology to make legal assistance more accessible while maintaining 
                the precision and reliability that legal matters demand.
              </p>
            </div>
            <div className="bg-blue-50 p-8 rounded-lg">
              <div className="text-center">
                <Globe className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-900 mb-2">Serving Singapore</h4>
                <p className="text-gray-600">
                  Proudly serving individuals, businesses, and legal professionals across Singapore 
                  with comprehensive legal assistance and resources.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Legal Help?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of Singaporeans who trust us for their legal assistance needs
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/contact">Contact Us</Link>
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
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/legal-categories" className="hover:text-white transition-colors">Legal Areas</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal Areas</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/legal-categories/family-law" className="hover:text-white transition-colors">Family Law</Link></li>
                <li><Link href="/legal-categories/employment-law" className="hover:text-white transition-colors">Employment Law</Link></li>
                <li><Link href="/legal-categories/property-law" className="hover:text-white transition-colors">Property Law</Link></li>
                <li><Link href="/legal-categories/corporate-law" className="hover:text-white transition-colors">Corporate Law</Link></li>
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
