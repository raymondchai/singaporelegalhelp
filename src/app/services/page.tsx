import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Scale, 
  FileText, 
  Users, 
  Building, 
  Briefcase, 
  Home,
  Heart,
  CreditCard,
  Shield,
  MessageSquare,
  Clock,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Legal Services | Singapore Legal Help',
  description: 'Comprehensive legal services for individuals and businesses in Singapore. Expert legal advice, document preparation, and consultation services.',
}

const services = [
  {
    icon: Scale,
    title: 'Legal Consultation',
    description: 'Get expert legal advice from qualified Singapore lawyers',
    features: ['30-minute consultation', 'Written legal opinion', 'Follow-up support'],
    price: 'From $150',
    category: 'Consultation'
  },
  {
    icon: FileText,
    title: 'Document Preparation',
    description: 'Professional legal document drafting and review services',
    features: ['Contract drafting', 'Legal document review', 'Template customization'],
    price: 'From $200',
    category: 'Documentation'
  },
  {
    icon: Building,
    title: 'Corporate Law',
    description: 'Business formation, compliance, and corporate legal matters',
    features: ['Company incorporation', 'Board resolutions', 'Compliance advice'],
    price: 'From $500',
    category: 'Corporate'
  },
  {
    icon: Home,
    title: 'Property Law',
    description: 'Real estate transactions, property disputes, and conveyancing',
    features: ['Property purchase/sale', 'Lease agreements', 'Property disputes'],
    price: 'From $800',
    category: 'Property'
  },
  {
    icon: Users,
    title: 'Family Law',
    description: 'Divorce, custody, matrimonial property, and family disputes',
    features: ['Divorce proceedings', 'Child custody', 'Matrimonial assets'],
    price: 'From $300',
    category: 'Family'
  },
  {
    icon: Briefcase,
    title: 'Employment Law',
    description: 'Workplace disputes, employment contracts, and HR compliance',
    features: ['Employment contracts', 'Workplace disputes', 'Termination advice'],
    price: 'From $250',
    category: 'Employment'
  }
]

const processSteps = [
  {
    step: 1,
    title: 'Initial Consultation',
    description: 'Discuss your legal needs with our qualified lawyers'
  },
  {
    step: 2,
    title: 'Legal Assessment',
    description: 'We analyze your case and provide expert recommendations'
  },
  {
    step: 3,
    title: 'Service Delivery',
    description: 'Receive professional legal services tailored to your needs'
  },
  {
    step: 4,
    title: 'Ongoing Support',
    description: 'Continued legal support and follow-up as needed'
  }
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Legal Services</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Professional legal services for individuals and businesses in Singapore. 
              Get expert legal advice from qualified lawyers.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Legal Services</h2>
          <p className="text-lg text-gray-600">
            Comprehensive legal solutions tailored to your specific needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon
            return (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <Badge variant="secondary">{service.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    {service.description}
                  </CardDescription>
                  
                  <div className="space-y-2 mb-4">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-blue-600">{service.price}</span>
                    <Button asChild>
                      <Link href="/contact">Get Quote</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Process Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">
              Simple steps to get the legal help you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Contact us today for a consultation with our experienced legal team
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">
                <MessageSquare className="h-5 w-5 mr-2" />
                Contact Us
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              <Link href="/auth/register">
                <Clock className="h-5 w-5 mr-2" />
                Book Consultation
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
