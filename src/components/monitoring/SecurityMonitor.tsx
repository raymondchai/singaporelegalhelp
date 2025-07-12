'use client'

import { useEffect, useCallback } from 'react'
import { logSecurityError } from '@/lib/error-handling'

interface SecurityEvent {
  type: 'csp_violation' | 'xss_attempt' | 'suspicious_request' | 'rate_limit_exceeded' | 'auth_failure'
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
}

interface CSPViolationEvent {
  'blocked-uri': string
  'document-uri': string
  'effective-directive': string
  'original-policy': string
  'referrer': string
  'status-code': number
  'violated-directive': string
}

export function SecurityMonitor() {
  const reportSecurityEvent = useCallback((event: SecurityEvent) => {
    // Log to our error tracking system
    logSecurityError(
      `Security Event: ${event.type}`,
      event.type,
      {
        ...event.details,
        severity: event.severity,
        timestamp: event.timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href,
      }
    )

    // Send to security monitoring endpoint
    fetch('/api/security/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }).catch(error => {
      console.error('Failed to report security event:', error)
    })

    // For critical events, also send immediate alert
    if (event.severity === 'critical') {
      fetch('/api/security/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'critical_security_event',
          event,
          timestamp: Date.now(),
        }),
      }).catch(error => {
        console.error('Failed to send security alert:', error)
      })
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Content Security Policy violation monitoring
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violationDetails: CSPViolationEvent = {
        'blocked-uri': event.blockedURI,
        'document-uri': event.documentURI,
        'effective-directive': event.effectiveDirective,
        'original-policy': event.originalPolicy,
        'referrer': event.referrer,
        'status-code': event.statusCode,
        'violated-directive': event.violatedDirective,
      }

      reportSecurityEvent({
        type: 'csp_violation',
        details: violationDetails,
        severity: 'medium',
        timestamp: Date.now(),
      })
    }

    // XSS attempt detection (basic patterns)
    const detectXSSAttempts = () => {
      const suspiciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>/gi,
        /eval\s*\(/gi,
        /document\.write/gi,
      ]

      const checkForXSS = (value: string) => {
        return suspiciousPatterns.some(pattern => pattern.test(value))
      }

      // Monitor form inputs
      const forms = document.querySelectorAll('form')
      forms.forEach(form => {
        form.addEventListener('submit', (event) => {
          const formData = new FormData(form)
          for (const [key, value] of Array.from(formData.entries())) {
            if (typeof value === 'string' && checkForXSS(value)) {
              event.preventDefault()
              reportSecurityEvent({
                type: 'xss_attempt',
                details: {
                  field: key,
                  value: value.substring(0, 200), // Truncate for logging
                  form_action: form.action,
                },
                severity: 'high',
                timestamp: Date.now(),
              })
            }
          }
        })
      })

      // Monitor URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      for (const [key, value] of Array.from(urlParams.entries())) {
        if (checkForXSS(value)) {
          reportSecurityEvent({
            type: 'xss_attempt',
            details: {
              parameter: key,
              value: value.substring(0, 200),
              source: 'url_parameter',
            },
            severity: 'high',
            timestamp: Date.now(),
          })
        }
      }
    }

    // Rate limiting detection (client-side)
    const trackRequestRate = () => {
      const requestCounts = new Map<string, number[]>()
      const RATE_LIMIT_WINDOW = 60000 // 1 minute
      const MAX_REQUESTS_PER_MINUTE = 100

      const originalFetch = window.fetch
      window.fetch = async (...args) => {
        const url = args[0] as string
        const now = Date.now()
        
        // Track requests per endpoint
        const endpoint = url.split('?')[0] // Remove query params
        const timestamps = requestCounts.get(endpoint) || []
        
        // Remove old timestamps
        const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW)
        recentTimestamps.push(now)
        requestCounts.set(endpoint, recentTimestamps)

        // Check if rate limit exceeded
        if (recentTimestamps.length > MAX_REQUESTS_PER_MINUTE) {
          reportSecurityEvent({
            type: 'rate_limit_exceeded',
            details: {
              endpoint,
              request_count: recentTimestamps.length,
              time_window: RATE_LIMIT_WINDOW,
            },
            severity: 'medium',
            timestamp: now,
          })
        }

        return originalFetch(...args)
      }
    }

    // Authentication failure monitoring
    const monitorAuthFailures = () => {
      let failedAttempts = 0
      const MAX_FAILED_ATTEMPTS = 5
      const LOCKOUT_DURATION = 300000 // 5 minutes

      // Monitor login form submissions
      const loginForms = document.querySelectorAll('form[data-auth="login"]')
      loginForms.forEach(form => {
        form.addEventListener('submit', async (event) => {
          // This would be triggered by auth errors from the API
          // For now, we'll set up a listener for auth events
        })
      })

      // Listen for auth events from the auth context
      window.addEventListener('auth-error', ((event: CustomEvent) => {
        failedAttempts++
        
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          reportSecurityEvent({
            type: 'auth_failure',
            details: {
              failed_attempts: failedAttempts,
              error_type: event.detail?.type || 'unknown',
              lockout_duration: LOCKOUT_DURATION,
            },
            severity: 'high',
            timestamp: Date.now(),
          })
        }
      }) as EventListener)
    }

    // Suspicious activity detection
    const detectSuspiciousActivity = () => {
      let rapidClicks = 0
      let lastClickTime = 0
      const RAPID_CLICK_THRESHOLD = 10
      const RAPID_CLICK_WINDOW = 1000 // 1 second

      document.addEventListener('click', () => {
        const now = Date.now()
        if (now - lastClickTime < RAPID_CLICK_WINDOW) {
          rapidClicks++
          if (rapidClicks > RAPID_CLICK_THRESHOLD) {
            reportSecurityEvent({
              type: 'suspicious_request',
              details: {
                activity_type: 'rapid_clicking',
                click_count: rapidClicks,
                time_window: RAPID_CLICK_WINDOW,
              },
              severity: 'low',
              timestamp: now,
            })
            rapidClicks = 0 // Reset counter
          }
        } else {
          rapidClicks = 1
        }
        lastClickTime = now
      })

      // Monitor for automated behavior patterns
      let keystrokes: number[] = []
      document.addEventListener('keydown', () => {
        const now = Date.now()
        keystrokes.push(now)
        
        // Keep only recent keystrokes
        keystrokes = keystrokes.filter(ts => now - ts < 5000)
        
        // Check for suspiciously regular typing patterns
        if (keystrokes.length > 20) {
          const intervals = keystrokes.slice(1).map((ts, i) => ts - keystrokes[i])
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
          const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - avgInterval, 2), 0) / intervals.length
          
          // Very low variance might indicate automated typing
          if (variance < 100) {
            reportSecurityEvent({
              type: 'suspicious_request',
              details: {
                activity_type: 'automated_typing',
                keystroke_variance: variance,
                average_interval: avgInterval,
              },
              severity: 'medium',
              timestamp: now,
            })
          }
        }
      })
    }

    // Initialize all monitoring
    document.addEventListener('securitypolicyviolation', handleCSPViolation)
    detectXSSAttempts()
    trackRequestRate()
    monitorAuthFailures()
    detectSuspiciousActivity()

    // Cleanup
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation)
    }
  }, [reportSecurityEvent])

  return null // This component doesn't render anything
}

// Hook for manual security event reporting
export function useSecurityReporting() {
  const reportSecurityEvent = useCallback((event: Omit<SecurityEvent, 'timestamp'>) => {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    }

    // Log to error tracking
    logSecurityError(
      `Security Event: ${event.type}`,
      event.type,
      event.details
    )

    // Send to security endpoint
    fetch('/api/security/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullEvent),
    }).catch(error => {
      console.error('Failed to report security event:', error)
    })
  }, [])

  return { reportSecurityEvent }
}
