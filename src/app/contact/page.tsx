import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  MessageSquare,
  Send
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | Singapore Legal Help',
  description: 'Get in touch with Singapore Legal Help. Contact our legal experts for consultation, advice, and professional legal services.',
}

const contactInfo = [
  {
    icon: Phone,
    title: 'Phone',
    details: ['+65 6123 4567', '+65 9876 5432'],
    description: 'Call us during business hours'
  },
  {
    icon: Mail,
    title: 'Email',
    details: ['info@singaporelegalhelp.com', 'support@singaporelegalhelp.com'],
    description: 'Send us an email anytime'
  },
  {
    icon: MapPin,
    title: 'Office',
    details: ['123 Legal Street', 'Singapore 123456'],
    description: 'Visit our office for consultation'
  },
  {
    icon: Clock,
    title: 'Hours',
    details: ['Mon-Fri: 9:00 AM - 6:00 PM', 'Sat: 9:00 AM - 1:00 PM'],
    description: 'Our business hours'
  }
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Get in touch with our legal experts. We're here to help with your legal needs.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john.doe@example.com" />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+65 1234 5678" />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="Legal consultation inquiry" />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Please describe your legal needs or questions..."
                      rows={6}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-gray-600 mb-8">
                We're here to help with all your legal needs. Contact us through any of the following methods:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => {
                const IconComponent = info.icon
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                          {info.details.map((detail, idx) => (
                            <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                          ))}
                          <p className="text-gray-500 text-xs mt-1">{info.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Emergency Contact */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-red-800 mb-2">Emergency Legal Assistance</h3>
                <p className="text-red-700 text-sm mb-3">
                  For urgent legal matters outside business hours:
                </p>
                <p className="font-semibold text-red-800">+65 9999 8888</p>
                <p className="text-red-600 text-xs mt-1">
                  Emergency hotline available 24/7 for critical legal issues
                </p>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Our Location</h3>
                <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p>Interactive map coming soon</p>
                    <p className="text-sm">123 Legal Street, Singapore 123456</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">
              Quick answers to common questions about our services
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">How quickly can I get a consultation?</h3>
                <p className="text-gray-600">
                  We typically schedule consultations within 24-48 hours. For urgent matters, same-day consultations may be available.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What are your consultation fees?</h3>
                <p className="text-gray-600">
                  Initial consultations start from $150 for 30 minutes. Fees vary depending on the complexity of your legal matter.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Do you offer services in languages other than English?</h3>
                <p className="text-gray-600">
                  Yes, we have lawyers who speak Mandarin, Malay, and Tamil. Please specify your language preference when booking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
