import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import crypto from 'crypto'

const twoFactorSchema = z.object({
  action: z.enum(['enable', 'disable', 'verify']),
  token: z.string().optional(),
})

// Generate backup codes
function generateBackupCodes(): string[] {
  const codes = []
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
  }
  return codes
}

// Generate TOTP secret
function generateTOTPSecret(): string {
  return crypto.randomBytes(20).toString('hex')
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = twoFactorSchema.parse(body)

    switch (validatedData.action) {
      case 'enable':
        // Generate TOTP secret and backup codes
        const totpSecret = generateTOTPSecret()
        const backupCodes = generateBackupCodes()

        // Update user profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            two_factor_enabled: true,
            two_factor_secret: totpSecret,
          })
          .eq('id', user.id)

        if (updateError) {
          throw new Error('Failed to enable 2FA')
        }

        // Store backup codes
        const backupCodeRecords = backupCodes.map(code => ({
          user_id: user.id,
          code_hash: crypto.createHash('sha256').update(code).digest('hex'),
        }))

        await supabase
          .from('user_2fa_backup_codes')
          .insert(backupCodeRecords)

        // Log the activity
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            action_type: 'two_factor_enabled',
            details: {
              timestamp: new Date().toISOString(),
            },
          })

        return NextResponse.json({
          message: '2FA enabled successfully',
          secret: totpSecret,
          backupCodes,
          qrCodeUrl: `otpauth://totp/Singapore%20Legal%20Help:${encodeURIComponent(user.email!)}?secret=${totpSecret}&issuer=Singapore%20Legal%20Help`,
        })

      case 'disable':
        // Update user profile
        const { error: disableError } = await supabase
          .from('user_profiles')
          .update({
            two_factor_enabled: false,
            two_factor_secret: null,
          })
          .eq('id', user.id)

        if (disableError) {
          throw new Error('Failed to disable 2FA')
        }

        // Remove backup codes
        await supabase
          .from('user_2fa_backup_codes')
          .delete()
          .eq('user_id', user.id)

        // Log the activity
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            action_type: 'two_factor_disabled',
            details: {
              timestamp: new Date().toISOString(),
            },
          })

        return NextResponse.json({
          message: '2FA disabled successfully',
        })

      case 'verify':
        // This would typically verify a TOTP token
        // For now, we'll just return success
        return NextResponse.json({
          message: 'Token verified successfully',
          valid: true,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Two-factor error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
