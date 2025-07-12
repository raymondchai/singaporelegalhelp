import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin endpoint to create users properly using service role key
export async function POST(request: NextRequest) {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Creating admin users...')

    // Create Raymond Chai admin user
    const { data: user1, error: error1 } = await supabaseAdmin.auth.admin.createUser({
      email: 'raymond.chai@8atoms.com',
      password: 'Welcome@123++',
      email_confirm: true,
      user_metadata: {
        full_name: 'Raymond Chai',
        user_type: 'admin'
      }
    })

    if (error1) {
      console.error('Error creating raymond.chai@8atoms.com:', error1)
      return NextResponse.json({ error: 'Failed to create first admin user', details: error1 }, { status: 400 })
    }

    console.log('Created user 1:', user1.user?.email)

    // Create second admin user
    const { data: user2, error: error2 } = await supabaseAdmin.auth.admin.createUser({
      email: '8thrives@gmail.com',
      password: 'Welcome@123++',
      email_confirm: true,
      user_metadata: {
        full_name: '8Thrives Admin',
        user_type: 'admin'
      }
    })

    if (error2) {
      console.error('Error creating 8thrives@gmail.com:', error2)
      return NextResponse.json({ error: 'Failed to create second admin user', details: error2 }, { status: 400 })
    }

    console.log('Created user 2:', user2.user?.email)

    // Create profiles for both users
    const { error: profileError1 } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user1.user!.id,
        email: 'raymond.chai@8atoms.com',
        full_name: 'Raymond Chai',
        user_type: 'admin',
        role: 'Super Admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError1) {
      console.error('Error creating profile 1:', profileError1)
    }

    const { error: profileError2 } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user2.user!.id,
        email: '8thrives@gmail.com',
        full_name: '8Thrives Admin',
        user_type: 'admin',
        role: 'Super Admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError2) {
      console.error('Error creating profile 2:', profileError2)
    }

    return NextResponse.json({
      success: true,
      message: 'Admin users created successfully',
      users: [
        { email: user1.user?.email, id: user1.user?.id },
        { email: user2.user?.email, id: user2.user?.id }
      ]
    })

  } catch (error) {
    console.error('Admin user creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
