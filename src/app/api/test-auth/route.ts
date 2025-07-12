import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('API TEST: Attempting authentication for:', email)
    
    // Test authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    console.log('API TEST: Auth result:', { 
      success: !!data.user, 
      error: error?.message,
      user: data.user?.email 
    })
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 400 })
    }
    
    if (!data.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No user returned' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        confirmed: data.user.email_confirmed_at !== null
      }
    })
    
  } catch (error: any) {
    console.error('API TEST ERROR:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
