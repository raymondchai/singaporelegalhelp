import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user's payment methods
    const { data: paymentMethods, error: paymentError } = await supabase
      .from('user_payment_methods')
      .select(`
        id,
        payment_type,
        last_four_digits,
        card_brand,
        bank_name,
        account_type,
        phone_number,
        email,
        is_default,
        expiry_month,
        expiry_year,
        is_active,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (paymentError) {
      console.error('Payment methods fetch error:', paymentError)
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' },
        { status: 500 }
      )
    }

    // Format payment methods
    const formattedMethods = (paymentMethods || []).map(method => ({
      id: method.id,
      type: method.payment_type,
      last4: method.last_four_digits,
      brand: method.card_brand,
      bankName: method.bank_name,
      accountType: method.account_type,
      phoneNumber: method.phone_number,
      email: method.email,
      isDefault: method.is_default,
      expiryMonth: method.expiry_month,
      expiryYear: method.expiry_year,
      isExpired: method.expiry_month && method.expiry_year ? 
        new Date(method.expiry_year, method.expiry_month - 1) < new Date() : false
    }))

    return NextResponse.json({
      success: true,
      paymentMethods: formattedMethods
    })

  } catch (error) {
    console.error('Payment methods API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { type, subscriptionId, paymentData } = body

    // Validate payment method type
    const validTypes = ['card', 'bank', 'nets', 'paynow', 'grabpay']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid payment method type' },
        { status: 400 }
      )
    }

    // Check if this is the user's first payment method
    const { count: existingCount } = await supabase
      .from('user_payment_methods')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    const isFirstMethod = (existingCount || 0) === 0

    // Here you would integrate with payment processors
    // For demonstration, we'll create a mock payment method
    const mockPaymentMethod = createMockPaymentMethod(type, paymentData)

    // Insert payment method
    const { data: paymentMethod, error: insertError } = await supabase
      .from('user_payment_methods')
      .insert({
        user_id: user.id,
        payment_type: type,
        last_four_digits: mockPaymentMethod.last4,
        card_brand: mockPaymentMethod.brand,
        bank_name: mockPaymentMethod.bankName,
        account_type: mockPaymentMethod.accountType,
        phone_number: mockPaymentMethod.phoneNumber,
        email: mockPaymentMethod.email,
        expiry_month: mockPaymentMethod.expiryMonth,
        expiry_year: mockPaymentMethod.expiryYear,
        is_default: isFirstMethod, // First method becomes default
        is_active: true,
        external_payment_method_id: mockPaymentMethod.externalId
      })
      .select()
      .single()

    if (insertError) {
      console.error('Payment method insertion error:', insertError)
      return NextResponse.json(
        { error: 'Failed to add payment method' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'payment_method_added',
        metadata: {
          payment_method_id: paymentMethod.id,
          payment_type: type
        }
      })

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.payment_type,
        last4: paymentMethod.last_four_digits,
        brand: paymentMethod.card_brand,
        isDefault: paymentMethod.is_default
      }
    })

  } catch (error) {
    console.error('Add payment method API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to create mock payment method data
function createMockPaymentMethod(type: string, paymentData: any) {
  const mockData: any = {
    externalId: `mock_${type}_${Date.now()}`
  }

  switch (type) {
    case 'card':
      mockData.last4 = '4242'
      mockData.brand = 'visa'
      mockData.expiryMonth = 12
      mockData.expiryYear = 2028
      break
    case 'nets':
      mockData.last4 = '1234'
      mockData.brand = 'nets'
      mockData.expiryMonth = 12
      mockData.expiryYear = 2028
      break
    case 'bank':
      mockData.bankName = 'DBS Bank'
      mockData.accountType = 'Savings'
      break
    case 'paynow':
      mockData.phoneNumber = '+65 9123 4567'
      break
    case 'grabpay':
      mockData.phoneNumber = '+65 9123 4567'
      break
  }

  return mockData
}
