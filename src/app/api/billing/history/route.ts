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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get billing transactions
    let query = supabase
      .from('billing_transactions')
      .select(`
        id,
        subscription_id,
        amount_sgd,
        currency,
        status,
        transaction_date,
        invoice_number,
        invoice_url,
        payment_method_type,
        payment_method_details,
        description,
        due_date,
        paid_date,
        refund_amount,
        refund_date,
        line_items,
        created_at
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (subscriptionId) {
      query = query.eq('subscription_id', subscriptionId)
    }

    const { data: transactions, error: transactionError } = await query

    if (transactionError) {
      console.error('Billing history fetch error:', transactionError)
      return NextResponse.json(
        { error: 'Failed to fetch billing history' },
        { status: 500 }
      )
    }

    // Format invoices
    const invoices = (transactions || []).map(transaction => ({
      id: transaction.id,
      amount: transaction.amount_sgd,
      currency: transaction.currency,
      status: transaction.status,
      date: transaction.transaction_date,
      invoiceNumber: transaction.invoice_number || `INV-${transaction.id.slice(0, 8)}`,
      description: transaction.description || 'Subscription payment',
      invoiceUrl: transaction.invoice_url,
      paymentMethod: transaction.payment_method_type,
      dueDate: transaction.due_date,
      paidDate: transaction.paid_date,
      refundAmount: transaction.refund_amount,
      refundDate: transaction.refund_date,
      items: transaction.line_items || [
        {
          description: transaction.description || 'Subscription payment',
          quantity: 1,
          unitPrice: transaction.amount_sgd,
          amount: transaction.amount_sgd
        }
      ]
    }))

    // Get total count for pagination
    const { count } = await supabase
      .from('billing_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Billing history API error:', error)
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
    const { 
      subscriptionId, 
      amount, 
      currency = 'SGD', 
      description, 
      paymentMethodId,
      lineItems 
    } = body

    // Create billing transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('billing_transactions')
      .insert({
        user_id: user.id,
        subscription_id: subscriptionId,
        amount_sgd: amount,
        currency,
        status: 'pending',
        description,
        payment_method_id: paymentMethodId,
        line_items: lineItems,
        transaction_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        invoice_number: generateInvoiceNumber()
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      )
    }

    // Here you would integrate with payment processor (Stripe, NETS, etc.)
    // For now, we'll simulate the payment process

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount_sgd,
        currency: transaction.currency,
        status: transaction.status,
        invoiceNumber: transaction.invoice_number
      }
    })

  } catch (error) {
    console.error('Billing transaction API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate invoice numbers
function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `SLH-${year}${month}${day}-${random}`
}
