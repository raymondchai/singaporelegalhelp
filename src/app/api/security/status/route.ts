import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile with security information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        two_factor_enabled,
        password_last_changed,
        failed_login_attempts,
        last_login_at,
        account_locked_until,
        terms_accepted_date,
        privacy_policy_accepted_date,
        pdpa_consent_date
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch security status' },
        { status: 500 }
      )
    }

    // Get active sessions count
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    if (sessionsError) {
      console.error('Sessions fetch error:', sessionsError)
    }

    // Get recent failed login attempts
    const { data: recentFailures, error: failuresError } = await supabase
      .from('user_activity_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('action_type', 'login_failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    if (failuresError) {
      console.error('Failed logins fetch error:', failuresError)
    }

    // Calculate security status
    const securityStatus = {
      two_factor_enabled: profile.two_factor_enabled || false,
      password_last_changed: profile.password_last_changed || user.created_at,
      failed_login_attempts: recentFailures?.length || 0,
      active_sessions: sessions?.length || 1, // At least current session
      last_login_at: profile.last_login_at || user.created_at,
      account_locked_until: profile.account_locked_until,
    }

    // Calculate compliance status
    const complianceStatus = {
      pdpa_consent: !!profile.pdpa_consent_date,
      terms_accepted: !!profile.terms_accepted_date,
      privacy_policy_accepted: !!profile.privacy_policy_accepted_date,
      data_retention_compliant: true, // Assume compliant for now
      audit_log_enabled: true, // Always enabled
    }

    // Get security recommendations
    const recommendations = []
    
    if (!securityStatus.two_factor_enabled) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security to your account',
        action: 'enable_2fa',
      })
    }

    const passwordAge = new Date().getTime() - new Date(securityStatus.password_last_changed).getTime()
    const daysOld = passwordAge / (1000 * 60 * 60 * 24)
    if (daysOld > 90) {
      recommendations.push({
        type: 'security',
        priority: daysOld > 180 ? 'high' : 'medium',
        title: 'Update Your Password',
        description: `Your password is ${Math.floor(daysOld)} days old`,
        action: 'change_password',
      })
    }

    if (securityStatus.failed_login_attempts > 0) {
      recommendations.push({
        type: 'security',
        priority: 'medium',
        title: 'Review Failed Login Attempts',
        description: `${securityStatus.failed_login_attempts} failed attempts in the last 24 hours`,
        action: 'review_activity',
      })
    }

    if (!complianceStatus.pdpa_consent) {
      recommendations.push({
        type: 'compliance',
        priority: 'high',
        title: 'PDPA Consent Required',
        description: 'Complete PDPA consent for Singapore compliance',
        action: 'update_consent',
      })
    }

    return NextResponse.json({
      security_status: securityStatus,
      compliance_status: complianceStatus,
      recommendations,
      last_updated: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Security status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update security settings
export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, data } = await request.json()

    switch (action) {
      case 'reset_failed_attempts':
        // Reset failed login attempts
        const { error: resetError } = await supabase
          .from('user_profiles')
          .update({ failed_login_attempts: 0 })
          .eq('id', user.id)

        if (resetError) {
          throw new Error('Failed to reset login attempts')
        }

        // Log the action
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            action_type: 'security_reset_failed_attempts',
            details: { reset_by: 'user' },
          })

        return NextResponse.json({
          message: 'Failed login attempts reset successfully',
        })

      case 'lock_account':
        // Lock account for security
        const lockUntil = new Date(Date.now() + (data.hours || 1) * 60 * 60 * 1000)
        
        const { error: lockError } = await supabase
          .from('user_profiles')
          .update({ account_locked_until: lockUntil.toISOString() })
          .eq('id', user.id)

        if (lockError) {
          throw new Error('Failed to lock account')
        }

        // Log the action
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            action_type: 'security_account_locked',
            details: { 
              locked_until: lockUntil.toISOString(),
              reason: data.reason || 'user_request'
            },
          })

        return NextResponse.json({
          message: 'Account locked successfully',
          locked_until: lockUntil.toISOString(),
        })

      case 'unlock_account':
        // Unlock account
        const { error: unlockError } = await supabase
          .from('user_profiles')
          .update({ account_locked_until: null })
          .eq('id', user.id)

        if (unlockError) {
          throw new Error('Failed to unlock account')
        }

        // Log the action
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            action_type: 'security_account_unlocked',
            details: { unlocked_by: 'user' },
          })

        return NextResponse.json({
          message: 'Account unlocked successfully',
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Security update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
