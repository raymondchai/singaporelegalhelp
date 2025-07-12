import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// Webhook delivery function (to be called by other parts of the system)
export async function deliverWebhook(
  userId: string,
  eventType: string,
  eventData: any
): Promise<void> {
  try {
    // Get active webhooks for this user that listen to this event type
    const { data: webhooks, error } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('events', [eventType])

    if (error) {
      console.error('Error fetching webhooks:', error)
      return
    }

    if (!webhooks || webhooks.length === 0) {
      return // No webhooks configured for this event
    }

    // Deliver to each webhook
    for (const webhook of webhooks) {
      await deliverToWebhook(webhook, eventType, eventData)
    }
  } catch (error) {
    console.error('Error in webhook delivery:', error)
  }
}

async function deliverToWebhook(webhook: any, eventType: string, eventData: any) {
  const payload = {
    event_type: eventType,
    data: eventData,
    timestamp: new Date().toISOString(),
    webhook_id: webhook.id
  }

  // Create signature if secret key is provided
  let signature = null
  if (webhook.secret_key) {
    const hmac = crypto.createHmac('sha256', webhook.secret_key)
    hmac.update(JSON.stringify(payload))
    signature = `sha256=${hmac.digest('hex')}`
  }

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Singapore-Legal-Help-Webhooks/1.0'
  }

  if (signature) {
    headers['X-Webhook-Signature'] = signature
  }

  let attempt = 0
  let success = false
  let lastError = null

  while (attempt <= webhook.max_retries && !success) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(webhook.timeout_seconds * 1000)
      })

      if (response.ok) {
        success = true
        
        // Log successful delivery
        await supabase
          .from('webhook_deliveries')
          .insert({
            webhook_id: webhook.id,
            event_type: eventType,
            payload: payload,
            status: 'success',
            response_status: response.status,
            response_body: await response.text().catch(() => ''),
            attempt_number: attempt + 1,
            delivered_at: new Date().toISOString()
          })
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error: any) {
      lastError = error
      attempt++
      
      if (attempt <= webhook.max_retries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, webhook.retry_delay_seconds * 1000))
      }
    }
  }

  // Log failed delivery if all attempts failed
  if (!success && lastError) {
    await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload: payload,
        status: 'failed',
        error_message: lastError.message,
        attempt_number: attempt,
        delivered_at: new Date().toISOString()
      })
  }
}
